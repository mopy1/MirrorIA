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
import { CobroSobreVentaMuertaException } from '../exception/cobro-sobre-venta-muerta.exception.js';
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

    // Reutiliza la fila pendiente si ya existe, en vez de crear otra: un
    // refresh de la pantalla de pago no debe duplicarla. Sin esto, el panel
    // de cobros del equipo acumula filas indistinguibles para una sola venta
    // y, si la expiracion cancela la venta con la primera, las duplicadas
    // fallan al cancelar y quedan pendientes para siempre.
    const existente = await this.pagoRepository.findOne({
      where: { ventaId, estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.MANUAL },
    });

    // Si la clienta cambio de metodo (de QR a efectivo, por ejemplo), se
    // actualiza la misma fila en vez de crear una nueva.
    const pago = existente
      ? await this.pagoRepository.save({ ...existente, metodo: dto.metodo })
      : await this.pagoRepository.save(
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

    // Mismo criterio que el camino manual: si esta venta ya tiene un cobro con
    // tarjeta pendiente, se reutiliza. Sin esto, cada llamada abria una sesion
    // NUEVA en la pasarela, y con dos sesiones abiertas y las dos pagadas
    // quedaban dos cobros reales y dos filas aprobadas sobre una sola venta,
    // sin que nada lo detectara — el panel del equipo tampoco las muestra,
    // porque filtra por cobros manuales.
    const existente = await this.pagoRepository.findOne({
      where: { ventaId, estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.STRIPE },
    });
    if (existente?.referenciaExterna) {
      const abierta = await this.pasarela.recuperarSesion(existente.referenciaExterna);
      if (abierta) {
        return { url: abierta.url };
      }
      // La sesion caduco o ya no acepta pagos: hay que crear otra, pero sobre
      // la MISMA fila (abajo), para no dejar dos pendientes por una venta.
    }

    const sesion = await this.pasarela.crearSesion({
      montoCents: venta.totalCents,
      descripcion: this.descripcionParaLaPasarela(venta),
      referencia: venta.id,
      // Con el id de la venta en la URL, la pantalla de regreso sabe que
      // consultar sin depender solo de sessionStorage (que falla si la
      // clienta vuelve en otra pestaña, otro dispositivo, o borro datos de
      // navegacion).
      urlExito: this.conVentaId(this.config.get<string>('PAGOS_URL_EXITO') ?? '', ventaId),
      urlCancelacion: this.conVentaId(
        this.config.get<string>('PAGOS_URL_CANCELACION') ?? '',
        ventaId,
      ),
    });

    await this.pagoRepository.save(
      existente
        ? {
            ...existente,
            montoCents: venta.totalCents,
            eventId: `sesion:${sesion.id}`,
            referenciaExterna: sesion.id,
          }
        : this.pagoRepository.create({
            ventaId,
            proveedorPago: ProveedorPago.STRIPE,
            metodo: MetodoPago.TARJETA,
            montoCents: venta.totalCents,
            estado: EstadoPago.PENDIENTE,
            // Hasta que llegue el evento firmado del webhook, la unicidad la da
            // la sesion recien creada, no un evento (que todavia no existe).
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
    // Reintento de la pasarela sobre un pago ya aprobado: no se cobra de nuevo
    // y no hay nada que anotar. Stripe reintenta de rutina.
    if (pago.estado === EstadoPago.APROBADO) {
      return { procesado: false };
    }
    // RECHAZADO o REEMBOLSADO es otra cosa completamente: entro dinero sobre
    // algo muerto. RECHAZADO es justamente el estado que deja la expiracion,
    // asi que este es el caso de la clienta que se demoro pagando, la
    // expiracion le cancelo la venta, y ella pago igual — Stripe le cobro de
    // verdad. Descartarlo en silencio dejaba plata cobrada sin log, sin marca
    // y sin rastro. Mismo rescate que el de la venta cancelada, abajo.
    if (pago.estado !== EstadoPago.PENDIENTE) {
      this.logger.error(
        `Pago ${pago.id} de la venta ${pago.ventaId} recibio el aviso de cobro ${evento.id} estando ya ${pago.estado}: entro dinero sobre un cobro muerto`,
      );
      pago.motivoReembolso = `Cobro acreditado por la pasarela sobre un pago ya ${pago.estado}: requiere reembolso`;
      await this.pagoRepository.save(pago);
      // 200 igual: ningun reintento de la pasarela arregla esto.
      return { procesado: false };
    }

    pago.estado = EstadoPago.APROBADO;
    // Se guarda el id del evento real: el indice unique impide que otro pago
    // distinto reclame el mismo evento.
    pago.eventId = evento.id;

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(Pago).save(pago);
        await this.ventasService.marcarPagada(pago.ventaId, manager);
      });
      return { procesado: true };
    } catch (error) {
      // La clienta PAGO, pero la venta ya no se puede cobrar: la expiracion la
      // cancelo y su stock ya volvio al inventario. Revertir el pago perderia la
      // constancia de que entro dinero, asi que se guarda marcado para reembolso
      // y queda a la vista de una persona.
      this.logger.error(
        `Pago ${pago.id} cobrado sobre la venta ${pago.ventaId}, que ya no es pagable: ${String(error)}`,
      );
      pago.motivoReembolso = 'Venta cancelada antes de acreditarse el cobro: requiere reembolso';
      await this.pagoRepository.save(pago);
      // 200 a proposito: la pasarela no tiene que reintentar algo que ya no va a
      // mejorar solo. El problema lo resuelve una persona, no un reintento.
      return { procesado: false };
    }
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
    try {
      const guardado = await this.dataSource.transaction(async (manager) => {
        const pagoGuardado = await manager.getRepository(Pago).save(pago);
        await this.ventasService.marcarPagada(pago.ventaId, manager);
        return pagoGuardado;
      });
      return this.aDto(guardado);
    } catch (error) {
      // Mismo criterio que el webhook: la plata ya esta en la mano del cajero.
      // Dejar que la transaccion revierta entera lo dejaba con el dinero y sin
      // ninguna constancia. El pago se guarda igual, marcado para reembolso.
      this.logger.error(
        `Pago ${pago.id} cobrado a mano sobre la venta ${pago.ventaId}, que ya no es pagable: ${String(error)}`,
      );
      pago.motivoReembolso =
        'Dinero recibido en mano sobre una venta ya cancelada: requiere reembolso';
      await this.pagoRepository.save(pago);
      // La diferencia deliberada con el webhook: aca hay una persona esperando
      // una respuesta, asi que el error SI se muestra — tiene que enterarse de
      // que le toca devolver el dinero.
      throw new CobroSobreVentaMuertaException(pago.id, String(error));
    }
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

  /**
   * Lo que la clienta lee en el formulario de la pasarela. Antes era
   * `Compra <numeroComprobante ?? id>` y, como ese campo no se escribe nunca,
   * terminaba mostrando el uuid crudo: "Compra 8f3a1c9e-4b2d-...". Se usan los
   * primeros caracteres en mayusculas, igual que el panel de ventas.
   */
  private descripcionParaLaPasarela(venta: { id: string; numeroComprobante: string | null }): string {
    const referencia = venta.numeroComprobante ?? `#${venta.id.slice(0, 8).toUpperCase()}`;
    return `MirrorIA — Compra ${referencia}`;
  }

  /**
   * Agrega `?venta=<id>` (o `&venta=<id>` si la URL configurada ya trae un
   * `?`) a la URL de regreso de la pasarela, para que la pantalla de vuelta
   * sepa que venta consultar. Si la URL no esta configurada, se deja vacia
   * tal cual (nada que agregarle).
   */
  private conVentaId(url: string, ventaId: string): string {
    if (!url) return url;
    const separador = url.includes('?') ? '&' : '?';
    return `${url}${separador}venta=${ventaId}`;
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
