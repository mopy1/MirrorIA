import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import type { DataSource } from 'typeorm';
import { Not, Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../../core/exception/recurso-no-encontrado.exception.js';
import { assertOwnUser } from '../../../../core/security/assert-own-user.js';
import type { JwtPayload } from '../../../../core/security/jwt-payload.interface.js';
import { VentasService } from '../../../ventas/service/ventas.service.js';
import type {
  CobroQrResponseDto,
  EstadoCobroQr,
  EstadoCobroQrResponseDto,
} from '../../dto/cobro-qr-response.dto.js';
import {
  EstadoPago,
  MetodoPago,
  Pago,
  ProveedorPago,
} from '../../entities/pago.entity.js';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { VentaNoPagableException } from '../../exception/venta-no-pagable.exception.js';
import { ExpiracionService } from '../expiracion.service.js';
import type { AvisoPagoQr } from './aviso-pago-qr.js';
import { firmaAvisoValida, secretoAvisosQr } from './firma-aviso.js';

export const COMERCIO_QR = 'MirrorIA';
const PREFIJO_TRANSACCION = 'wayra:';

/** Lo que el banco necesita saber de un QR para mostrarlo al escanearlo. */
export interface CobroQrPublico {
  montoCents: number;
  referencia: string;
  estado: EstadoCobroQr;
  transaccion: string | null;
  pagadoEn: Date | null;
}

/**
 * El lado COMERCIO del cobro por QR dinamico. Genera un QR distinto por compra
 * (con su monto y su referencia), y da la compra por pagada solo cuando llega
 * el aviso FIRMADO del banco — igual que el webhook de Stripe con la tarjeta.
 *
 * El banco de esta demo es Wayra (`../wayra/`), simulado dentro del mismo
 * backend porque conseguir credenciales de una pasarela QR real no estaba a
 * nuestro alcance. Cambiar a una real es reemplazar ese simulador por el
 * proveedor: este servicio ya habla en su idioma (token, aviso firmado).
 */
@Injectable()
export class CobroQrService {
  private readonly logger = new Logger(CobroQrService.name);

  constructor(
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly ventasService: VentasService,
    private readonly config: ConfigService,
    private readonly expiracionService: ExpiracionService,
  ) {}

  /** La clienta eligio pagar con QR: se genera (o se reutiliza) el de su compra. */
  async iniciar(
    ventaId: string,
    user: JwtPayload,
  ): Promise<CobroQrResponseDto> {
    await this.expiracionService.expirarVencidas();
    const venta = await this.ventasService.findOne(ventaId);
    assertOwnUser(venta.clienteId ?? '', user);
    if (venta.estado !== 'PENDIENTE') {
      throw new VentaNoPagableException(`su estado es ${venta.estado}`);
    }

    // Recargar la pantalla de pago no puede generar otro QR: el que ya esta en
    // la pantalla (o en la foto que alguien le saco) tiene que seguir valiendo.
    const existente = await this.pagoRepository.findOne({
      where: {
        ventaId,
        estado: EstadoPago.PENDIENTE,
        proveedorPago: ProveedorPago.WAYRA,
      },
    });
    // Un QR viejo con otro monto no se reutiliza: el banco cobraria lo que dice
    // el QR y el aviso se rechazaria por no coincidir con la venta.
    if (existente && existente.montoCents !== venta.totalCents) {
      await this.pagoRepository.update(
        { id: existente.id, estado: EstadoPago.PENDIENTE },
        { estado: EstadoPago.RECHAZADO },
      );
    }
    const pago =
      existente && existente.montoCents === venta.totalCents
        ? existente
        : await this.pagoRepository.save(
            this.nuevoCobro(ventaId, venta.totalCents),
          );

    const qrContenido = this.urlDelQr(pago.referenciaExterna ?? '');
    const qrImagen = await QRCode.toDataURL(qrContenido, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return {
      pagoId: pago.id,
      ventaId,
      montoCents: pago.montoCents,
      comercio: COMERCIO_QR,
      referencia: referenciaDeVenta(ventaId),
      qrImagen,
      qrContenido,
      estado: 'PENDIENTE',
    };
  }

  /** Lo que la tienda consulta cada pocos segundos mientras muestra el QR. */
  async estadoParaLaClienta(
    pagoId: string,
    user: JwtPayload,
  ): Promise<EstadoCobroQrResponseDto> {
    const pago = await this.pagoRepository.findOne({
      where: { id: pagoId, proveedorPago: ProveedorPago.WAYRA },
    });
    if (!pago) {
      throw new RecursoNoEncontradoException('Cobro QR', pagoId);
    }
    const venta = await this.ventasService.findOne(pago.ventaId);
    assertOwnUser(venta.clienteId ?? '', user);

    return {
      pagoId: pago.id,
      ventaId: pago.ventaId,
      montoCents: pago.montoCents,
      ...this.estadoPublico(pago, venta.estado),
    };
  }

  /** Lo que ve el banco al escanear: no exige sesion, el token ES la llave. */
  async consultarPorToken(token: string): Promise<CobroQrPublico> {
    // Sin barrida de vencidas aca: es una ruta publica y cada visita disparaba
    // dos consultas pesadas. La barrida corre sola cada 5 minutos.
    const pago = await this.buscarPorToken(token);
    const venta = await this.ventasService.findOne(pago.ventaId);
    return {
      montoCents: pago.montoCents,
      referencia: referenciaDeVenta(pago.ventaId),
      ...this.estadoPublico(pago, venta.estado),
    };
  }

  /**
   * Unica via por la que una compra por QR se da por pagada: el aviso del banco
   * con la firma valida. Mismo criterio que `PagosService.procesarEvento`.
   */
  async procesarAviso(
    cuerpoCrudo: Buffer,
    firma: string,
  ): Promise<{ procesado: boolean }> {
    if (!firmaAvisoValida(cuerpoCrudo, firma, secretoAvisosQr(this.config))) {
      throw new FirmaWebhookInvalidaException();
    }
    let aviso: AvisoPagoQr;
    try {
      aviso = JSON.parse(cuerpoCrudo.toString('utf8')) as AvisoPagoQr;
    } catch {
      throw new FirmaWebhookInvalidaException();
    }
    if (
      aviso.tipo !== 'cobro_qr.pagado' ||
      !aviso.token ||
      !aviso.transaccion
    ) {
      return { procesado: false };
    }

    const pago = await this.pagoRepository.findOne({
      where: {
        referenciaExterna: aviso.token,
        proveedorPago: ProveedorPago.WAYRA,
      },
    });
    if (!pago) {
      this.logger.warn(`Aviso ${aviso.id} para un QR desconocido`);
      return { procesado: false };
    }
    // El banco reintenta: un aviso repetido sobre un QR ya pagado no hace nada.
    if (pago.estado === EstadoPago.APROBADO) {
      return { procesado: false };
    }
    if (aviso.montoCents !== pago.montoCents) {
      this.logger.error(
        `Aviso ${aviso.id} acredita ${aviso.montoCents} sobre el QR ${pago.id} de ${pago.montoCents}: no se acredita`,
      );
      return { procesado: false };
    }
    if (pago.estado !== EstadoPago.PENDIENTE) {
      this.logger.error(
        `QR ${pago.id} de la venta ${pago.ventaId} pagado estando ya ${pago.estado}: entro dinero sobre un cobro muerto`,
      );
      // update y no save: un save con el objeto leido antes pisaria lo que otro
      // proceso escribio mientras tanto.
      await this.pagoRepository.update(
        { id: pago.id },
        {
          motivoReembolso: `Pago por QR acreditado sobre un cobro ya ${pago.estado}: requiere reembolso`,
        },
      );
      return { procesado: false };
    }

    // El unique de event_id impide que otro pago reclame la misma transaccion.
    // La hora del banco viaja ahi tambien: `updatedAt` no sirve como hora de
    // pago porque la base lo guarda sin zona y se lee corrido 4 horas (ver
    // registro de pagos, P13), y agregar una columna exigiria migrar.
    const pagadoEnMs = Date.parse(aviso.pagadoEn);
    const eventId = `${PREFIJO_TRANSACCION}${aviso.transaccion}${
      Number.isFinite(pagadoEnMs) ? `@${pagadoEnMs}` : ''
    }`;

    try {
      const acreditado = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Pago);
        // UPDATE condicionado a PENDIENTE, no "leer, chequear y guardar": con
        // dos avisos simultaneos sobre el mismo QR (doble toque, dos celulares)
        // los dos leian PENDIENTE y los dos respondian "procesado". Asi la base
        // deja pasar a uno solo; el otro ve affected = 0.
        const { affected } = await repo.update(
          { id: pago.id, estado: EstadoPago.PENDIENTE },
          { estado: EstadoPago.APROBADO, eventId },
        );
        if (affected !== 1) {
          return false;
        }
        await this.ventasService.marcarPagada(pago.ventaId, manager);
        // Si antes habia elegido efectivo, ese intento ya no se va a cobrar:
        // sin esto quedaba pendiente para siempre en el panel de cobros.
        await repo.update(
          {
            ventaId: pago.ventaId,
            estado: EstadoPago.PENDIENTE,
            id: Not(pago.id),
          },
          { estado: EstadoPago.RECHAZADO },
        );
        return true;
      });
      return { procesado: acreditado };
    } catch (error) {
      // Solo "la venta ya no se puede cobrar" se resuelve aca. Un corte de la
      // base, un deadlock o un choque de event_id NO son una venta cancelada:
      // marcarlos asi dejaba un pago RECHAZADO con un motivo falso.
      if (
        !(error instanceof OperacionInvalidaException) &&
        !(error instanceof RecursoNoEncontradoException)
      ) {
        throw error;
      }
      this.logger.error(
        `QR ${pago.id} pagado sobre la venta ${pago.ventaId}, que ya no es pagable: ${String(error)}`,
      );
      // RECHAZADO y no APROBADO: la tienda no puede mostrar "pago recibido"
      // sobre una compra cancelada. La transaccion queda en event_id como
      // constancia de que entro dinero.
      await this.pagoRepository.update(
        { id: pago.id, estado: Not(EstadoPago.APROBADO) },
        {
          estado: EstadoPago.RECHAZADO,
          eventId,
          motivoReembolso:
            'Venta cancelada antes de acreditarse el pago por QR: requiere reembolso',
        },
      );
      return { procesado: false };
    }
  }

  private nuevoCobro(ventaId: string, montoCents: number): Pago {
    // 18 bytes al azar: el token va en la URL publica del QR y es lo unico que
    // separa a un curioso de ver (y pagar) una compra ajena, asi que no puede
    // ser adivinable como un id secuencial.
    const token = randomBytes(18).toString('base64url');
    return this.pagoRepository.create({
      ventaId,
      proveedorPago: ProveedorPago.WAYRA,
      metodo: MetodoPago.QR,
      montoCents,
      estado: EstadoPago.PENDIENTE,
      eventId: `qr:${token}`,
      referenciaExterna: token,
    });
  }

  private async buscarPorToken(token: string): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { referenciaExterna: token, proveedorPago: ProveedorPago.WAYRA },
    });
    if (!pago) {
      throw new RecursoNoEncontradoException('Cobro QR');
    }
    return pago;
  }

  private estadoPublico(
    pago: Pago,
    estadoVenta: string,
  ): {
    estado: EstadoCobroQr;
    transaccion: string | null;
    pagadoEn: Date | null;
  } {
    if (pago.estado === EstadoPago.APROBADO) {
      return { estado: 'PAGADO', ...leerTransaccion(pago.eventId) };
    }
    // La compra se pago por otro lado (otro QR, efectivo): este QR quedo sin
    // uso, pero decir "vencio, el stock volvio a la tienda" seria falso.
    if (estadoVenta === 'PAGADA' || estadoVenta === 'ENTREGADA') {
      return { estado: 'PAGADO', transaccion: null, pagadoEn: null };
    }
    const vigente =
      pago.estado === EstadoPago.PENDIENTE && estadoVenta === 'PENDIENTE';
    return {
      estado: vigente ? 'PENDIENTE' : 'VENCIDO',
      transaccion: null,
      pagadoEn: null,
    };
  }

  /**
   * A donde lleva el QR al escanearlo. Sin WAYRA_URL_BASE se usa el origen de
   * PAGOS_URL_EXITO, que en la VM ya apunta al dominio publico: asi el QR
   * funciona desde cualquier celular sin configurar nada nuevo.
   */
  private urlDelQr(token: string): string {
    return `${this.urlBaseDelBanco()}/wayra/pagar/${token}`;
  }

  private urlBaseDelBanco(): string {
    const propia = this.config.get<string>('WAYRA_URL_BASE');
    if (propia) return propia.replace(/\/+$/, '');
    const exito = this.config.get<string>('PAGOS_URL_EXITO');
    if (exito) {
      try {
        return new URL(exito).origin;
      } catch {
        // URL mal escrita: se cae al valor de desarrollo.
      }
    }
    return 'http://localhost:5174';
  }
}

/** `#8F3A1C9E`: los primeros caracteres del id, igual que el panel de ventas. */
export function referenciaDeVenta(ventaId: string): string {
  return `#${ventaId.slice(0, 8).toUpperCase()}`;
}

/** `wayra:<transaccion>@<epoch ms>` -> numero de transaccion y hora del banco. */
function leerTransaccion(eventId: string): {
  transaccion: string | null;
  pagadoEn: Date | null;
} {
  if (!eventId.startsWith(PREFIJO_TRANSACCION)) {
    return { transaccion: null, pagadoEn: null };
  }
  const [transaccion, ms] = eventId
    .slice(PREFIJO_TRANSACCION.length)
    .split('@');
  const pagadoEn = ms ? new Date(Number(ms)) : null;
  return {
    transaccion: transaccion || null,
    pagadoEn: pagadoEn && !Number.isNaN(pagadoEn.getTime()) ? pagadoEn : null,
  };
}
