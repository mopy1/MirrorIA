import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { assertOwnUser } from '../../../core/security/assert-own-user.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { VentasService } from '../../ventas/service/ventas.service.js';
import type { IniciarPagoDto } from '../dto/iniciar-pago.dto.js';
import type { InstruccionesResponseDto } from '../dto/instrucciones-response.dto.js';
import type { PagoResponseDto } from '../dto/pago-response.dto.js';
import { EstadoPago, MetodoPago, Pago, ProveedorPago } from '../entities/pago.entity.js';
import { PasarelaNoConfiguradaException } from '../exception/pasarela-no-configurada.exception.js';
import { VentaNoPagableException } from '../exception/venta-no-pagable.exception.js';
import { ExpiracionService } from './expiracion.service.js';
import { PASARELA } from './pasarela/pasarela.interface.js';
import type { Pasarela } from './pasarela/pasarela.interface.js';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly ventasService: VentasService,
    private readonly config: ConfigService,
    private readonly expiracionService: ExpiracionService,
    @Inject(PASARELA) private readonly pasarela: Pasarela,
  ) {}

  /**
   * Arranca un cobro por QR o efectivo. No cobra nada: crea el registro en
   * PENDIENTE y devuelve lo que la clienta necesita ver. Quien cobra de verdad
   * es una persona, confirmando despues.
   */
  async iniciarManual(
    ventaId: string,
    dto: IniciarPagoDto,
    user: JwtPayload,
  ): Promise<InstruccionesResponseDto> {
    await this.expiracionService.expirarVencidas();
    const venta = await this.ventasService.findOne(ventaId);
    assertOwnUser(venta.clienteId ?? '', user);
    if (venta.estado !== 'PENDIENTE') {
      throw new VentaNoPagableException(`su estado es ${venta.estado}`);
    }

    const pago = await this.pagoRepository.save(
      this.pagoRepository.create({
        ventaId,
        proveedorPago: ProveedorPago.MANUAL,
        metodo: dto.metodo,
        montoCents: venta.totalCents,
        estado: EstadoPago.PENDIENTE,
        // El unique de event_id exige un valor siempre. Para un cobro manual no
        // hay evento de ninguna pasarela, asi que se genera uno propio.
        eventId: `manual:${randomUUID()}`,
        referenciaExterna: null,
      }),
    );

    const esQr = dto.metodo === MetodoPago.QR;
    return {
      pagoId: pago.id,
      metodo: dto.metodo,
      montoCents: venta.totalCents,
      referencia: venta.numeroComprobante ?? venta.id,
      qrUrl: esQr ? (this.config.get<string>('PAGOS_QR_URL') ?? null) : null,
      instrucciones: esQr
        ? 'Escaneá el código con la app de tu banco y mostrá el comprobante al retirar.'
        : 'Pagá en efectivo al retirar tu pedido en la sucursal elegida.',
    };
  }

  /**
   * Arranca un cobro con tarjeta: crea la sesion alojada en la pasarela y
   * devuelve la URL a la que mandar a la clienta. El formulario de tarjeta
   * nunca toca nuestro codigo. El pago queda PENDIENTE hasta que el webhook
   * (firmado) confirme el cobro — ver `procesarEvento`.
   */
  async iniciarTarjeta(ventaId: string, user: JwtPayload): Promise<{ url: string }> {
    await this.expiracionService.expirarVencidas();
    if (!this.pasarela.estaConfigurada()) {
      throw new PasarelaNoConfiguradaException();
    }

    const venta = await this.ventasService.findOne(ventaId);
    assertOwnUser(venta.clienteId ?? '', user);
    if (venta.estado !== 'PENDIENTE') {
      throw new VentaNoPagableException(`su estado es ${venta.estado}`);
    }

    const sesion = await this.pasarela.crearSesion({
      montoCents: venta.totalCents,
      descripcion: `Compra ${venta.numeroComprobante ?? venta.id}`,
      referencia: venta.id,
      urlExito: this.config.get<string>('PAGOS_URL_EXITO') ?? '',
      urlCancelacion: this.config.get<string>('PAGOS_URL_CANCELACION') ?? '',
    });

    await this.pagoRepository.save(
      this.pagoRepository.create({
        ventaId,
        proveedorPago: ProveedorPago.STRIPE,
        metodo: MetodoPago.TARJETA,
        montoCents: venta.totalCents,
        estado: EstadoPago.PENDIENTE,
        // Hasta que llegue el evento firmado del webhook, la unicidad la da la
        // sesion recien creada, no un evento (que todavia no existe).
        eventId: `sesion:${sesion.id}`,
        referenciaExterna: sesion.id,
      }),
    );

    return { url: sesion.url };
  }

  /**
   * Unica via por la que una compra con tarjeta se da por cobrada. El regreso de
   * la clienta desde la pasarela NO prueba nada: esa URL se puede escribir a mano.
   *
   * No llama a la expiracion: este camino tiene que ser corto, porque la pasarela
   * reintenta si tarda.
   */
  async procesarEvento(cuerpoCrudo: Buffer, firma: string): Promise<{ procesado: boolean }> {
    // Si la firma no valida, esto lanza y no se toca nada.
    const evento = this.pasarela.verificarEvento(cuerpoCrudo, firma);

    if (evento.tipo !== 'pagado' || !evento.sesionId) {
      return { procesado: false };
    }

    const pago = await this.pagoRepository.findOne({
      where: { referenciaExterna: evento.sesionId },
    });
    if (!pago) {
      this.logger.warn(`Evento ${evento.id} para una sesion desconocida`);
      return { procesado: false };
    }
    // Reintento de la pasarela sobre un pago ya aprobado: no se cobra de nuevo.
    if (pago.estado !== EstadoPago.PENDIENTE) {
      return { procesado: false };
    }

    pago.estado = EstadoPago.APROBADO;
    // Se guarda el id del evento real: el indice unique impide que otro pago
    // distinto reclame el mismo evento.
    pago.eventId = evento.id;
    await this.pagoRepository.save(pago);
    await this.ventasService.marcarPagada(pago.ventaId);
    return { procesado: true };
  }

  /**
   * Un CAJERO o ADMIN declara que el dinero llego. Es la unica via para los
   * cobros manuales, porque ningun banco le avisa al sistema.
   */
  async confirmarManual(pagoId: string, user: JwtPayload): Promise<PagoResponseDto> {
    await this.expiracionService.expirarVencidas();
    const pago = await this.pagoRepository.findOne({ where: { id: pagoId } });
    if (!pago) {
      throw new RecursoNoEncontradoException('Pago', pagoId);
    }
    // Un cobro con tarjeta lo decide el webhook firmado de Stripe. Si se pudiera
    // confirmar a mano, cualquier cajero marcaria como cobrada una compra que la
    // pasarela nunca aprobo.
    if (pago.metodo === MetodoPago.TARJETA) {
      throw new VentaNoPagableException(
        'un cobro con tarjeta lo confirma la pasarela, no una persona',
      );
    }
    if (pago.estado === EstadoPago.APROBADO) {
      return this.aDto(pago);
    }
    if (pago.estado !== EstadoPago.PENDIENTE) {
      throw new VentaNoPagableException(`el pago esta en estado ${pago.estado}`);
    }

    pago.estado = EstadoPago.APROBADO;
    pago.referenciaExterna = `confirmado-por:${user.sub}`;
    // Mismo manager para las dos escrituras: si la venta ya no se puede cobrar
    // (por ejemplo, la expiracion la canceló mientras el cajero tenía la
    // pantalla abierta), el pago tampoco queda aprobado — o quedan las dos, o
    // ninguna.
    const guardado = await this.dataSource.transaction(async (manager) => {
      const pagoGuardado = await manager.getRepository(Pago).save(pago);
      await this.ventasService.marcarPagada(pago.ventaId, manager);
      return pagoGuardado;
    });
    return this.aDto(guardado);
  }

  /** Lo que ve el panel de cobros del equipo. */
  async pendientes(): Promise<PagoResponseDto[]> {
    const filas = await this.pagoRepository.find({
      where: { estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.MANUAL },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return filas.map((p) => this.aDto(p));
  }

  private aDto(pago: Pago): PagoResponseDto {
    return {
      id: pago.id,
      ventaId: pago.ventaId,
      proveedorPago: pago.proveedorPago,
      metodo: pago.metodo,
      montoCents: pago.montoCents,
      estado: pago.estado,
      referenciaExterna: pago.referenciaExterna,
      createdAt: pago.createdAt,
    };
  }
}
