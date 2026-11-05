import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { Not, Repository } from 'typeorm';
import { assertOwnUser } from '../../../core/security/assert-own-user.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { sucursalDelStaff } from '../../../core/security/sucursal-del-staff.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { conTenant, soloTenant, tenantActual } from '../../../core/tenancy/tenant-context.js';
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
   * Arranca un cobro en efectivo. No cobra nada: crea el registro en
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
    // fallan al cancelar y quedan pendientes para siempre. Con la venta
    // bloqueada: un doble clic simultaneo ya no crea dos filas.
    const pago = await this.dataSource.transaction(async (manager) => {
      await this.bloquearVentaPendiente(manager, ventaId);
      const repo = manager.getRepository(Pago);
      const existente = await repo.findOne({
        where: soloTenant({ ventaId, estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.MANUAL }),
      });

      // Si la clienta cambio de metodo (de QR a efectivo, por ejemplo), se
      // actualiza la misma fila en vez de crear una nueva.
      return existente
        ? repo.save({ ...existente, metodo: dto.metodo })
        : repo.save(
            repo.create({
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
    });

    // El QR ya no pasa por aca: tiene su propio camino (`CobroQrService`), que
    // se acredita solo con el aviso del banco en vez de esperar a un cajero.
    return {
      pagoId: pago.id,
      metodo: dto.metodo,
      montoCents: venta.totalCents,
      referencia: venta.numeroComprobante ?? venta.id,
      instrucciones: 'Pagá en efectivo al retirar tu pedido en la sucursal elegida.',
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

    // Stripe no abre una sesion por 0 (cupon del 100%): se avisa en vez de
    // dejar que la pasarela responda un error opaco.
    if (venta.totalCents <= 0) {
      throw new VentaNoPagableException(
        'el total es Bs 0: no hay nada que cobrar con tarjeta, elegí pagar en la sucursal',
      );
    }

    // Con la venta bloqueada (FOR UPDATE) mientras se decide y se guarda: un
    // doble clic simultaneo abria dos sesiones y dos filas pendientes.
    return this.dataSource.transaction(async (manager) => {
      await this.bloquearVentaPendiente(manager, ventaId);
      const repo = manager.getRepository(Pago);
      // Mismo criterio que el camino manual: si esta venta ya tiene un cobro con
      // tarjeta pendiente, se reutiliza. Sin esto, cada llamada abria una sesion
      // NUEVA en la pasarela, y con dos sesiones abiertas y las dos pagadas
      // quedaban dos cobros reales y dos filas aprobadas sobre una sola venta.
      const existente = await repo.findOne({
        where: soloTenant({ ventaId, estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.STRIPE }),
      });
      if (existente?.referenciaExterna) {
        const abierta = await this.pasarela.recuperarSesion(existente.referenciaExterna);
        // Sesion ya pagada con el webhook en camino: abrir otra pisaba
        // referenciaExterna y el webhook de la pagada quedaba "sesion desconocida".
        if (abierta === 'completa') {
          throw new OperacionInvalidaException(
            'Tu pago con tarjeta ya se realizó y se está confirmando: revisá Mis pedidos en unos segundos.',
          );
        }
        if (abierta) {
          return { url: abierta.url };
        }
        // La sesion caduco: hay que crear otra, pero sobre la MISMA fila (abajo),
        // para no dejar dos pendientes por una venta.
      }

      const sesion = await this.pasarela.crearSesion({
        montoCents: venta.totalCents,
        descripcion: this.descripcionParaLaPasarela(venta),
        referencia: venta.id,
        // Con el id de la venta en la URL, la pantalla de regreso sabe que
        // consultar sin depender solo de sessionStorage.
        urlExito: this.conVentaId(this.config.get<string>('PAGOS_URL_EXITO') ?? '', ventaId),
        urlCancelacion: this.conVentaId(
          this.config.get<string>('PAGOS_URL_CANCELACION') ?? '',
          ventaId,
        ),
        // La sesion cierra cuando vence la venta (el reloj arranca en el
        // intento de pago, igual que la barrida), no a las 24 h de Stripe.
        expiraEn: this.expiracionService.vencimientoTarjeta(existente?.createdAt ?? new Date()),
      });

      await repo.save(
        existente
          ? {
              ...existente,
              montoCents: venta.totalCents,
              eventId: `sesion:${sesion.id}`,
              referenciaExterna: sesion.id,
            }
          : repo.create({
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
    });
  }

  /**
   * "Volver al carrito": la clienta abandona una compra PENDIENTE sin pagar
   * (p. ej. salio de Stripe sin pagar). Se cancela con la misma logica que el
   * vencimiento (stock, cupon y prendas al carrito). Antes de cancelar se
   * cierra la sesion de tarjeta abierta: si ya se completo (o no se pudo
   * confirmar) no se cancela, para no cancelar una compra que se esta cobrando.
   */
  async cancelarPorClienta(ventaId: string, user: JwtPayload): Promise<void> {
    const venta = await this.ventasService.findOne(ventaId);
    assertOwnUser(venta.clienteId ?? '', user);
    if (venta.estado !== 'PENDIENTE') {
      throw new OperacionInvalidaException(
        `Esta compra ya no se puede cancelar: está ${venta.estado.toLowerCase()}`,
      );
    }
    const tarjeta = await this.pagoRepository.findOne({
      where: soloTenant({ ventaId, estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.STRIPE }),
    });
    if (tarjeta?.referenciaExterna && !(await this.pasarela.cerrarSesion(tarjeta.referenciaExterna))) {
      throw new OperacionInvalidaException(
        'Tu pago con tarjeta se está procesando: esperá la confirmación antes de cancelar.',
      );
    }
    await this.expiracionService.cancelarVenta(ventaId, 'la clienta volvio al carrito');
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

    // Stripe no manda tienda: el tenant sale de la fila del pago (id de sesión, único global).
    const pago = await this.pagoRepository.findOne({
      where: { referenciaExterna: evento.sesionId }, // sin-tenant: webhook, el tenant sale del pago
    });
    if (!pago) {
      this.logger.warn(`Evento ${evento.id} para una sesion desconocida`);
      return { procesado: false };
    }
    return conTenant({ tenantId: pago.tenantId }, () => this.acreditarEvento(pago, evento.id));
  }

  /** Resto del webhook, ya dentro del contexto de la tienda del pago. */
  private async acreditarEvento(pago: Pago, eventoId: string): Promise<{ procesado: boolean }> {
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
        `Pago ${pago.id} de la venta ${pago.ventaId} recibio el aviso de cobro ${eventoId} estando ya ${pago.estado}: entro dinero sobre un cobro muerto`,
      );
      pago.motivoReembolso = `Cobro acreditado por la pasarela sobre un pago ya ${pago.estado}: requiere reembolso`;
      await this.pagoRepository.save(pago);
      // 200 igual: ningun reintento de la pasarela arregla esto.
      return { procesado: false };
    }

    try {
      const procesado = await this.dataSource.transaction(async (manager) => {
        // Venta primero: mismo orden de bloqueo que efectivo y QR.
        await this.estadoVentaBloqueada(manager, pago.ventaId);
        const repo = manager.getRepository(Pago);
        // UPDATE condicionado y no save del objeto leido antes: si otro cobro
        // (QR, efectivo) gano mientras tanto, este pago ya quedo RECHAZADO y
        // aprobarlo pisaba esa marca (doble cobro sin rastro). Se guarda el id
        // del evento real: el indice unique impide que otro pago lo reclame.
        const { affected } = await repo.update(
          soloTenant({ id: pago.id, estado: EstadoPago.PENDIENTE }),
          { estado: EstadoPago.APROBADO, eventId: eventoId },
        );
        if (affected !== 1) {
          // El mismo evento entregado dos veces a la vez: el otro ya lo aprobo.
          const actual = await repo.findOne({ where: soloTenant({ id: pago.id }) });
          if (actual?.estado === EstadoPago.APROBADO && actual.eventId === eventoId) {
            return false;
          }
          throw new OperacionInvalidaException('el pago ya no estaba pendiente');
        }
        await this.ventasService.marcarPagada(pago.ventaId, manager);
        // Igual que el QR: los otros intentos pendientes (efectivo, QR) ya no se
        // cobran. Sin esto un cajero podia confirmar efectivo sobre una venta
        // ya pagada con tarjeta: doble cobro.
        await this.rechazarOtrosPendientes(repo, pago);
        return true;
      });
      return { procesado };
    } catch (error) {
      // La clienta PAGO, pero la venta ya no se puede cobrar (la expiracion la
      // cancelo, o ya la pago otro medio). Revertir perderia la constancia de
      // que entro dinero: se marca para reembolso, a la vista de una persona.
      this.logger.error(
        `Pago ${pago.id} cobrado sobre la venta ${pago.ventaId}, que ya no es pagable: ${String(error)}`,
      );
      await this.pagoRepository.update(
        soloTenant({ id: pago.id }),
        { motivoReembolso: 'Venta cancelada o ya pagada antes de acreditarse el cobro: requiere reembolso' },
      );
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
    const pago = await this.pagoRepository.findOne({ where: soloTenant({ id: pagoId }) });
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
    // Lo mismo con el QR dinamico: lo acredita el aviso firmado del banco.
    if (pago.proveedorPago === ProveedorPago.WAYRA) {
      throw new VentaNoPagableException(
        'un cobro por QR lo confirma el banco, no una persona',
      );
    }
    // Un cajero solo confirma efectivo de ventas de su sucursal (ADMIN, todas).
    const propia = sucursalDelStaff(user);
    if (propia && (await this.ventasService.findOne(pago.ventaId)).sucursalId !== propia) {
      throw new ForbiddenActionException('El cobro es de una venta de otra sucursal');
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
        // Venta bloqueada: si ya esta PAGADA (por tarjeta o QR) no se acepta el
        // efectivo — antes se aprobaba igual y quedaban dos cobros.
        if ((await this.estadoVentaBloqueada(manager, pago.ventaId)) === 'PAGADA') {
          throw new VentaNoPagableException('la venta ya está pagada por otro medio');
        }
        const repo = manager.getRepository(Pago);
        const pagoGuardado = await repo.save(pago);
        await this.ventasService.marcarPagada(pago.ventaId, manager);
        await this.rechazarOtrosPendientes(repo, pago);
        return pagoGuardado;
      });
      return this.aDto(guardado);
    } catch (error) {
      if (error instanceof VentaNoPagableException) throw error;
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

  /**
   * SELECT ... FOR UPDATE sobre la venta, dentro de la transaccion del
   * llamador. SQL directo y no la entidad: pagos no importa entidades de
   * ventas (regla 1). Serializa los cobros de una misma venta.
   */
  private async estadoVentaBloqueada(manager: EntityManager, ventaId: string): Promise<string | null> {
    const filas: { estado: string }[] = await manager.query(
      'SELECT estado FROM ventas WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [ventaId, tenantActual()],
    );
    return filas[0]?.estado ?? null;
  }

  private async bloquearVentaPendiente(manager: EntityManager, ventaId: string): Promise<void> {
    const estado = await this.estadoVentaBloqueada(manager, ventaId);
    if (estado !== 'PENDIENTE') {
      throw new VentaNoPagableException(`su estado es ${estado ?? 'desconocido'}`);
    }
  }

  /** Los demas intentos PENDIENTE de la venta quedan RECHAZADO (mismo criterio que el QR). */
  private async rechazarOtrosPendientes(repo: Repository<Pago>, pago: Pago): Promise<void> {
    await repo.update(
      soloTenant({ ventaId: pago.ventaId, estado: EstadoPago.PENDIENTE, id: Not(pago.id) }),
      { estado: EstadoPago.RECHAZADO },
    );
  }

  /** Lo que ve el panel de cobros del equipo; con sucursalId, solo esa sucursal. */
  async pendientes(sucursalId?: string): Promise<PagoResponseDto[]> {
    const qb = this.pagoRepository
      .createQueryBuilder('p')
      .where('p.estado = :estado AND p.tenant_id = :tenantId', {
        estado: EstadoPago.PENDIENTE,
        tenantId: tenantActual(),
      })
      .andWhere('p.proveedorPago = :prov', { prov: ProveedorPago.MANUAL });
    // Sin relacion ORM hacia ventas (regla 1): subconsulta por uuid.
    if (sucursalId) {
      qb.andWhere('p.ventaId IN (SELECT v.id FROM ventas v WHERE v.sucursal_id = :sucursalId AND v.tenant_id = :tenantId)', {
        sucursalId,
      });
    }
    const filas = await qb.orderBy('p.createdAt', 'DESC').take(100).getMany();
    return filas.map((p) => this.aDto(p));
  }

  /**
   * Lo que la clienta lee en el formulario de la pasarela. Antes era
   * `Compra <numeroComprobante ?? id>` y, como ese campo recien se escribe al quedar PAGADA,
   * terminaba mostrando el uuid crudo: "Compra 8f3a1c9e-4b2d-...". Se usan los
   * primeros caracteres en mayusculas, igual que el panel de ventas.
   */
  private descripcionParaLaPasarela(venta: { id: string; numeroComprobante: string | null }): string {
    const referencia = venta.numeroComprobante ?? `#${venta.id.slice(0, 8).toUpperCase()}`;
    // Pendiente (Fase 2): nombre de la tienda del contexto en vez del de la demo.
    return `Tiendaria — Compra ${referencia}`;
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
