import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { AvisoPagoQr } from '../../pagos/service/qr/aviso-pago-qr.js';
import type { PasarelaId } from '../../pagos/service/pasarela/pasarela.interface.js';
import { RegistroPasarelasService } from '../../pagos/service/pasarela/registro-pasarelas.service.js';
import type { CobroSuscripcionResponseDto, EstadoCobroSuscripcionResponseDto } from '../dto/cobro-suscripcion-response.dto.js';
import type { IniciarCobroSuscripcionDto } from '../dto/iniciar-cobro-suscripcion.dto.js';
import { CobroSuscripcion } from '../entities/cobro-suscripcion.entity.js';
import type { Plan } from '../entities/plan.entity.js';
import { InquilinosService } from './inquilinos.service.js';
import { PlanesService } from './planes.service.js';
import { SuscripcionesService } from './suscripciones.service.js';

export interface CobroQrSuscripcionPublico {
  montoCents: number;
  referencia: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  transaccion: string | null;
  pagadoEn: Date | null;
}

@Injectable()
export class CobrosSuscripcionService {
  private readonly logger = new Logger(CobrosSuscripcionService.name);

  constructor(
    @InjectRepository(CobroSuscripcion)
    private readonly repo: Repository<CobroSuscripcion>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly inquilinos: InquilinosService,
    private readonly planes: PlanesService,
    private readonly suscripciones: SuscripcionesService,
    private readonly registroPasarelas: RegistroPasarelasService,
    private readonly config: ConfigService,
  ) {}

  async iniciarCobro(
    inquilinoId: string,
    dto: IniciarCobroSuscripcionDto,
    actorEmail?: string,
    urlOrigen?: string,
  ): Promise<CobroSuscripcionResponseDto> {
    const inquilino = await this.inquilinos.detalle(inquilinoId);

    let plan: Plan;
    if (dto.planCodigo) {
      plan = await this.planes.porCodigo(dto.planCodigo, true);
    } else {
      const ultima = await this.suscripciones.ultima(inquilinoId);
      plan = ultima.plan;
    }

    const pasarela = this.registroPasarelas.asegurarDisponible(dto.pasarela, 'suscripcion');
    const cobroId = randomUUID();
    const eventId = `sub_${cobroId}`;

    const baseFront =
      urlOrigen?.replace(/\/+$/, '') ??
      (this.config.get<string>('PAGOS_URL_EXITO')
        ? new URL(this.config.get<string>('PAGOS_URL_EXITO')!).origin
        : 'http://localhost:5174');

    const urlExito = `${baseFront}/admin/suscripcion?pago=exito&cobro=${cobroId}`;
    const urlCancelacion = `${baseFront}/admin/suscripcion/activar?pago=cancelado&cobro=${cobroId}`;

    const resultado = await pasarela.iniciarCobro({
      montoCents: plan.precioMensualCents,
      montoUsdCents: plan.precioMensualUsdCents,
      moneda: dto.pasarela === 'STRIPE' && !pasarela.metadata.monedas.includes('BOB') ? 'USD' : 'BOB',
      descripcion: `Suscripción ${plan.nombre} — ${inquilino.nombre}`,
      referencia: cobroId,
      contexto: 'suscripcion',
      nombreComercio: inquilino.nombre,
      urlExito,
      urlCancelacion,
      expiraEn: new Date(Date.now() + 15 * 60 * 1000),
      metadata: {
        inquilinoId,
        planId: plan.id,
        planCodigo: plan.codigo,
        cobroId,
      },
    });

    const referenciaExterna = resultado.token ?? resultado.url ?? cobroId;
    const finalEventId = resultado.token ? `token:${resultado.token}` : eventId;

    const cobro = this.repo.create({
      id: cobroId,
      inquilinoId,
      planId: plan.id,
      proveedorPago: dto.pasarela,
      metodo: pasarela.metadata.tipo,
      montoCents: plan.precioMensualCents,
      estado: 'PENDIENTE',
      eventId: finalEventId,
      referenciaExterna,
      metadata: {
        planCodigo: plan.codigo,
        actorEmail: actorEmail ?? null,
        modo: resultado.modo,
        montoPasarelaCents: resultado.montoCobrado?.cents ?? null,
        monedaPasarela: resultado.montoCobrado?.moneda ?? null,
      },
    });

    await this.repo.save(cobro);

    return {
      cobroId: cobro.id,
      pasarela: dto.pasarela,
      modo: resultado.modo,
      montoCents: cobro.montoCents,
      url: resultado.url,
      qrBase64: resultado.qrBase64,
      token: resultado.token,
      expiraEn: resultado.expiraEn?.toISOString(),
      instrucciones: resultado.instrucciones,
    };
  }

  async obtenerEstado(
    inquilinoId: string,
    cobroId: string,
  ): Promise<EstadoCobroSuscripcionResponseDto> {
    const cobro = await this.repo.findOne({
      where: { id: cobroId, inquilinoId },
    });
    if (!cobro) {
      throw new RecursoNoEncontradoException('Cobro de suscripción', cobroId);
    }
    return {
      cobroId: cobro.id,
      estado: cobro.estado,
      pagado: cobro.estado === 'APROBADO',
      pagadoEn: cobro.estado === 'APROBADO' ? cobro.updatedAt.toISOString() : undefined,
    };
  }

  /**
   * La vuelta desde la pasarela. La URL de exito se puede escribir a mano, asi
   * que no prueba nada: el que decide es la pasarela. Ademas evita depender del
   * webhook, que puede tardar o no llegar.
   */
  async confirmarRegreso(
    inquilinoId: string,
    cobroId: string,
  ): Promise<EstadoCobroSuscripcionResponseDto> {
    const cobro = await this.repo.findOne({ where: { id: cobroId, inquilinoId } });
    if (!cobro) {
      throw new RecursoNoEncontradoException('Cobro de suscripción', cobroId);
    }
    const pagado = await this.confirmarConPasarela(cobro);
    return {
      cobroId,
      estado: pagado ? 'APROBADO' : cobro.estado,
      pagado,
      pagadoEn: pagado ? new Date().toISOString() : undefined,
    };
  }

  /** PayPal avisa al aprobar la orden, y sin captura no hay cobro: se confirma igual que el regreso. */
  async procesarAvisoPaypal(
    cuerpoCrudo: Buffer,
    cabeceras: Record<string, string>,
  ): Promise<{ procesado: boolean }> {
    const evento = await this.registroPasarelas
      .obtener('PAYPAL')
      .verificarNotificacion(cuerpoCrudo, cabeceras);
    if (evento.tipo !== 'PAGO_APROBADO') return { procesado: false };

    const cobro = await this.repo.findOne({
      where: { referenciaExterna: evento.referenciaExterna, proveedorPago: 'PAYPAL' },
    });
    if (!cobro) {
      this.logger.warn(`Aviso ${evento.id} de PayPal para una orden desconocida`);
      return { procesado: false };
    }
    return { procesado: await this.confirmarConPasarela(cobro) };
  }

  private async confirmarConPasarela(cobro: CobroSuscripcion): Promise<boolean> {
    if (cobro.estado === 'APROBADO') return true;
    if (cobro.estado !== 'PENDIENTE' || !cobro.referenciaExterna) return false;

    const pasarela = this.registroPasarelas.obtener(cobro.proveedorPago as PasarelaId);
    if (!pasarela.confirmarCobro) return false;
    const resultado = await pasarela.confirmarCobro(cobro.referenciaExterna);

    if (resultado.estado === 'RECHAZADO') {
      await this.repo.update({ id: cobro.id, estado: 'PENDIENTE' }, { estado: 'RECHAZADO' });
      cobro.estado = 'RECHAZADO';
      return false;
    }
    if (resultado.estado !== 'APROBADO' || !resultado.transaccion) return false;

    const esperado = cobro.metadata?.montoPasarelaCents;
    if (typeof esperado === 'number' && resultado.montoCents !== esperado) {
      this.logger.error(
        `Cobro SaaS ${cobro.id}: la pasarela cobro ${resultado.montoCents} y se esperaba ${esperado}`,
      );
      return false;
    }
    await this.aprobarUnaVez(
      cobro,
      `${cobro.proveedorPago.toLowerCase()}:${resultado.transaccion}`,
      resultado.transaccion,
    );
    return true;
  }

  /**
   * UPDATE condicionado y no save del objeto leido antes: con dos avisos a la
   * vez (o regreso y webhook) los dos leian PENDIENTE y se acreditaban dos meses
   * por un solo pago.
   */
  private async aprobarUnaVez(
    cobro: CobroSuscripcion,
    eventId: string,
    referencia: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { affected } = await manager
        .getRepository(CobroSuscripcion)
        .update({ id: cobro.id, estado: 'PENDIENTE' }, { estado: 'APROBADO', eventId });
      if (affected !== 1) return;
      await this.suscripciones.activarPorPago(
        cobro.inquilinoId,
        { proveedor: cobro.proveedorPago, referencia, montoCents: cobro.montoCents },
        manager,
      );
    });
    cobro.estado = 'APROBADO';
  }

  async acreditarCobro(
    cobroIdOEventId: string,
    referencia: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager ? manager.getRepository(CobroSuscripcion) : this.repo;
    const cobro = await repo.findOne({
      where: [
        { id: cobroIdOEventId },
        { eventId: cobroIdOEventId },
        { referenciaExterna: cobroIdOEventId },
      ],
    });
    if (!cobro) return false;
    if (cobro.estado === 'APROBADO') return true;

    cobro.estado = 'APROBADO';
    await repo.save(cobro);

    await this.suscripciones.activarPorPago(
      cobro.inquilinoId,
      {
        proveedor: cobro.proveedorPago,
        referencia,
        montoCents: cobro.montoCents,
      },
      manager,
    );
    return true;
  }

  async acreditarPorReferencia(referenciaExterna: string, eventId: string): Promise<boolean> {
    const cobro = await this.repo.findOne({
      where: { referenciaExterna },
    });
    if (!cobro) return false;
    if (cobro.estado === 'APROBADO') return true;

    await this.aprobarUnaVez(cobro, eventId, referenciaExterna);
    this.logger.log(`Cobro de suscripción ${cobro.id} acreditado por Stripe (${eventId})`);
    return true;
  }

  async acreditarPorAviso(aviso: AvisoPagoQr): Promise<boolean> {
    const cobro = await this.repo.findOne({
      where: { referenciaExterna: aviso.token, proveedorPago: 'WAYRA' },
    });
    if (!cobro) return false;
    if (cobro.estado === 'APROBADO') return true;

    if (aviso.montoCents !== cobro.montoCents) {
      this.logger.error(
        `Aviso ${aviso.id} acredita ${aviso.montoCents} sobre cobro SaaS ${cobro.id} de ${cobro.montoCents}: montos no coinciden`,
      );
      return false;
    }

    await this.aprobarUnaVez(cobro, `wayra:${aviso.transaccion}`, aviso.transaccion);
    this.logger.log(`Cobro de suscripción ${cobro.id} acreditado por Wayra QR (${aviso.transaccion})`);
    return true;
  }

  async consultarPorToken(token: string): Promise<CobroQrSuscripcionPublico | null> {
    const cobro = await this.repo.findOne({
      where: { referenciaExterna: token, proveedorPago: 'WAYRA' },
      relations: { plan: true },
    });
    if (!cobro) return null;

    return {
      montoCents: cobro.montoCents,
      referencia: `Suscripción ${cobro.plan?.nombre ?? 'SaaS'}`,
      estado: cobro.estado === 'APROBADO' ? 'PAGADO' : 'PENDIENTE',
      transaccion: cobro.estado === 'APROBADO' ? cobro.referenciaExterna : null,
      pagadoEn: cobro.estado === 'APROBADO' ? cobro.updatedAt : null,
    };
  }

  async simularPago(
    inquilinoId: string,
    cobroId: string,
  ): Promise<EstadoCobroSuscripcionResponseDto> {
    const cobro = await this.repo.findOne({
      where: { id: cobroId, inquilinoId },
    });
    if (!cobro) {
      throw new RecursoNoEncontradoException('Cobro de suscripción', cobroId);
    }
    if (cobro.estado === 'APROBADO') {
      return {
        cobroId,
        estado: 'APROBADO',
        pagado: true,
        pagadoEn: cobro.updatedAt.toISOString(),
      };
    }

    cobro.estado = 'APROBADO';
    await this.repo.save(cobro);

    await this.suscripciones.activarPorPago(inquilinoId, {
      proveedor: cobro.proveedorPago,
      referencia: `sim_${randomUUID().slice(0, 8)}`,
      montoCents: cobro.montoCents,
    });

    return {
      cobroId,
      estado: 'APROBADO',
      pagado: true,
      pagadoEn: new Date().toISOString(),
    };
  }
}
