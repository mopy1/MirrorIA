import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { soloTenant, tenantActual } from '../../../core/tenancy/tenant-context.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { InventarioSucursalService } from '../../inventario/service/inventario-sucursal.service.js';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { PromocionesService } from '../../promociones/service/promociones.service.js';
import { ReservasService } from '../../reservas/service/reservas.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { CheckoutCarritoDto } from '../dto/checkout-carrito.dto.js';
import type { ComprarReservaDto } from '../dto/comprar-reserva.dto.js';
import type { VentaResponseDto } from '../dto/ventas-response.dto.js';
import { CanalVenta, EstadoVenta, Venta } from '../entities/venta.entity.js';
import { VentaItem } from '../entities/venta-item.entity.js';
import { Carrito } from '../entities/carrito.entity.js';
import { CarritosService } from './carritos.service.js';
import { maxComprasPendientes, REGLAS_COMPRA } from '../reglas-compra.js';

// Comprobante corto y determinista, mismo criterio que el código de reserva
// (#XXXXXXXX): sin tabla ni secuencia, se deriva del id al quedar PAGADA.
export const comprobanteDe = (ventaId: string): string =>
  `C-${ventaId.slice(0, 8).toUpperCase()}`;

interface ItemAVender {
  varianteId: string;
  cantidad: number;
}

interface RegistrarVentaParams {
  items: ItemAVender[];
  sucursalId: string;
  canal: CanalVenta;
  clienteId: string | null;
  reservaId?: string | null;
  codigoCupon?: string | null;
  claveIdempotencia?: string | null;
}

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(VentaItem)
    private readonly ventaItemRepository: Repository<VentaItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly sucursalesService: SucursalesService,
    private readonly productosService: ProductosService,
    private readonly inventarioSucursalService: InventarioSucursalService,
    private readonly carritosService: CarritosService,
    private readonly reservasService: ReservasService,
    private readonly promocionesService: PromocionesService,
  ) {}

  /**
   * Compra desde la reserva: la clienta, ya EN_TIENDA, compra las prendas que
   * reservó. Nace PENDIENTE como el checkout y se paga igual (efectivo en caja,
   * Stripe o QR Wayra). No descuenta stock acá: las unidades siguen apartadas
   * por la reserva; al aprobarse el pago `marcarPagada` las da por vendidas y
   * completa la reserva. Si la compra se cancela o vence, la reserva vuelve a
   * su ciclo normal (EN_TIENDA hasta "No compró" o la barrida).
   */
  async comprarReserva(
    reservaId: string,
    usuarioId: string,
    dto: ComprarReservaDto,
  ): Promise<VentaResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const { sucursalId, items } = await this.reservasService.paraComprar(reservaId, usuarioId, manager);
      return this.registrarVenta(
        {
          items,
          sucursalId,
          canal: dto.canal === 'WEB' ? CanalVenta.WEB : CanalVenta.MOVIL,
          clienteId: usuarioId,
          reservaId,
          codigoCupon: dto.codigoCupon ?? null,
        },
        manager,
      );
    });
  }

  private async ventaPorClave(clave?: string): Promise<VentaResponseDto | null> {
    if (!clave) return null;
    const venta = await this.ventaRepository.findOne({ where: soloTenant({ claveIdempotencia: clave }) });
    return venta ? this.cargarYMapear(venta) : null;
  }

  // Compra digital (RF14/RF15/RF16): arranca en PENDIENTE; el cobro lo
  // resuelve el módulo `pagos` (pasarela o confirmación de la cajera).
  async checkoutCarrito(usuarioId: string, dto: CheckoutCarritoDto, clave?: string): Promise<VentaResponseDto> {
    await this.sucursalesService.assertExists(dto.sucursalId);
    const previa = await this.ventaPorClave(clave);
    if (previa) return previa;
    // Todo en una transacción con el carrito bloqueado (FOR UPDATE): antes el
    // carrito y el conteo de pendientes se leían afuera y el vaciado iba
    // después, así que 4 checkouts simultáneos del mismo carrito creaban 4
    // ventas (tope 2). Ahora el segundo espera y encuentra el carrito vacío.
    return this.dataSource.transaction(async (manager) => {
      const carrito = await manager.getRepository(Carrito).findOne({
        where: soloTenant({ usuarioId }),
        lock: { mode: 'pessimistic_write' },
      });
      const items = dto.items ?? carrito?.items ?? [];
      if (items.length === 0) {
        throw new OperacionInvalidaException(
          'El carrito está vacío, no se puede completar la compra',
        );
      }
      // El carrito ya lo limita al agregar, pero un carrito viejo (de antes del
      // tope) o editado por otra vía no debe poder saltárselo en el checkout.
      if (items.some((i) => i.cantidad > REGLAS_COMPRA.maxUnidadesPorVariante)) {
        throw new OperacionInvalidaException(
          `Podés llevar hasta ${REGLAS_COMPRA.maxUnidadesPorVariante} unidades de la misma talla y color por compra`,
        );
      }
      const pendientes = await manager.getRepository(Venta).count({
        where: soloTenant({ clienteId: usuarioId, estado: EstadoVenta.PENDIENTE }),
      });
      if (pendientes >= maxComprasPendientes()) {
        throw new OperacionInvalidaException(
          `Tenés ${pendientes} compras sin pagar. Pagá o esperá a que venza alguna ` +
            'antes de hacer otra (las encontrás en Mis pedidos).',
        );
      }

      const venta = await this.registrarVenta(
        {
          items,
          sucursalId: dto.sucursalId,
          canal: dto.canal === 'WEB' ? CanalVenta.WEB : CanalVenta.MOVIL,
          clienteId: usuarioId,
          codigoCupon: dto.codigoCupon ?? null,
          claveIdempotencia: clave ?? null,
        },
        manager,
      );

      await this.carritosService.vaciar(usuarioId, manager);
      return venta;
    });
  }

  async findAll(filtro: { sucursalId?: string; clienteId?: string }): Promise<VentaResponseDto[]> {
    const where: { sucursalId?: string; clienteId?: string } = {}; // se envuelve en soloTenant abajo
    if (filtro.sucursalId) where.sucursalId = filtro.sucursalId;
    if (filtro.clienteId) where.clienteId = filtro.clienteId;
    const ventas = await this.ventaRepository.find({
      where: soloTenant(where),
      order: { createdAt: 'DESC' },
    });
    return Promise.all(ventas.map((venta) => this.cargarYMapear(venta)));
  }

  async findOne(id: string): Promise<VentaResponseDto> {
    const venta = await this.ventaRepository.findOne({ where: soloTenant({ id }) });
    if (!venta) {
      throw new RecursoNoEncontradoException('Venta', id);
    }
    return this.cargarYMapear(venta);
  }

  /**
   * Lleva una venta de PENDIENTE a PAGADA. La llama el modulo `pagos` cuando un
   * cobro se aprueba — por webhook de Stripe, aviso de Wayra o confirmacion de
   * la cajera. Si es una compra desde la reserva, ahí recién se descuenta el
   * stock y la reserva pasa a COMPLETADA (en la misma transacción del pago).
   *
   * Idempotente a proposito: Stripe reintenta los webhooks, y una venta que ya
   * esta PAGADA tiene que quedarse quieta en vez de fallar. Pero una venta
   * CANCELADA si es un error: significa que su stock ya volvio al inventario y
   * cobrarla dejaria vendida mercaderia que el sistema cree tener.
   */
  async marcarPagada(ventaId: string, manager?: EntityManager): Promise<void> {
    // Los llamadores (pagos) pasan su transacción; sin ella se abre una, para
    // que el cobro y la venta de lo reservado queden juntos o no quede nada.
    if (!manager) return this.dataSource.transaction((m) => this.marcarPagada(ventaId, m));
    const repo = manager.getRepository(Venta);
    // UPDATE condicionado a PENDIENTE, no "leer y guardar": un pago tardío
    // leía PENDIENTE, la expiración cancelaba (devolviendo stock y cupón) y el
    // save pisaba CANCELADA con PAGADA. Si la cancelación tiene la fila
    // bloqueada, este UPDATE espera y luego no encuentra PENDIENTE.
    const { affected } = await repo.update(
      soloTenant({ id: ventaId, estado: EstadoVenta.PENDIENTE }),
      { estado: EstadoVenta.PAGADA, numeroComprobante: comprobanteDe(ventaId) },
    );
    const venta = await repo.findOne({ where: soloTenant({ id: ventaId }) });
    if (affected === 1) {
      if (venta?.reservaId) await this.venderLoReservado(venta, manager);
      return;
    }
    if (!venta) {
      throw new RecursoNoEncontradoException('Venta', ventaId);
    }
    if (venta.estado === EstadoVenta.PAGADA) {
      return;
    }
    throw new OperacionInvalidaException(`No se puede cobrar una venta en estado ${venta.estado}`);
  }

  // Compra desde la reserva ya pagada: las unidades apartadas pasan a
  // vendidas. Se resta cantidadDisponible sin respetar reservadas (son las de
  // esta reserva) y completarPorVenta libera su cantidadReservada: un solo
  // descuento.
  private async venderLoReservado(venta: Venta, manager: EntityManager): Promise<void> {
    const items = await manager
      .getRepository(VentaItem)
      .find({ where: soloTenant({ venta: { id: venta.id } }) });
    for (const item of items) {
      await this.inventarioSucursalService.ajustarStock({
        varianteId: item.varianteId,
        sucursalId: venta.sucursalId,
        cantidad: -item.cantidad,
        tipoMovimiento: TipoMovimientoInventario.VENTA,
        usuarioId: venta.clienteId,
        manager,
      });
    }
    await this.reservasService.completarPorVenta(venta.reservaId!, venta.sucursalId, manager);
  }

  /**
   * Las ventas todavia PENDIENTE, las mas viejas primero. La usa la barrida de
   * vencimientos del modulo `pagos`, que antes partia de la tabla `pagos` y por
   * eso no veia nunca una venta que nunca llego a crear una fila de pago: su
   * stock y su cupon no volvian jamas.
   *
   * El orden ascendente importa: con mas pendientes que el tope, sin `order` las
   * mas viejas — las que mas tiempo llevan reteniendo stock — podian quedar
   * afuera para siempre.
   *
   * GLOBAL a propósito (todas las tiendas): cada fila trae su tenantId y la
   * barrida cancela cada una dentro de conTenant.
   */
  async findPendientesMasViejasPrimero(limite: number): Promise<Venta[]> {
    return this.ventaRepository.find({
      where: { estado: EstadoVenta.PENDIENTE }, // sin-tenant: barrida global de todas las tiendas
      order: { createdAt: 'ASC' },
      take: limite,
    });
  }

  /**
   * Deshace un checkout que nunca se pago: devuelve el stock, devuelve el uso del
   * cupon, devuelve las prendas al carrito de la clienta y deja la venta
   * CANCELADA. Todo en una transaccion: o se deshacen las
   * dos cosas o no se deshace ninguna.
   *
   * El movimiento se registra como AJUSTE y no como DEVOLUCION porque la
   * mercaderia nunca salio — nadie pago ni retiro nada. Llamarlo devolucion
   * inflaria la metrica de devoluciones con ventas que jamas ocurrieron.
   */
  async cancelarPorPagoNoCompletado(ventaId: string, motivo: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const ventaRepo = manager.getRepository(Venta);
      // SELECT ... FOR UPDATE, dentro de la transaccion: sin el bloqueo, dos
      // barridas simultaneas leian las dos la venta en PENDIENTE y las dos
      // devolvian el stock, porque el estado recien se escribe al final. El
      // inventario ganaba unidades que no existen, registradas como ajustes
      // legitimos. No es teorico: no hay planificador, asi que la barrida
      // corre al inicio de tres endpoints de uso normal y alcanza con dos
      // clientas operando a la vez. Con el bloqueo, la segunda espera a que la
      // primera cierre y encuentra la venta ya CANCELADA.
      const venta = await ventaRepo.findOne({
        where: soloTenant({ id: ventaId }),
        lock: { mode: 'pessimistic_write' },
      });
      if (!venta) {
        throw new RecursoNoEncontradoException('Venta', ventaId);
      }
      if (venta.estado !== EstadoVenta.PENDIENTE) {
        throw new OperacionInvalidaException(
          `Solo se cancela una venta PENDIENTE, y esta esta en ${venta.estado}`,
        );
      }

      const items = await manager.getRepository(VentaItem).find({
        where: soloTenant({ venta: { id: ventaId } }),
      });

      // Una compra desde la reserva nunca descontó stock (sigue apartado por
      // la reserva) ni vació el carrito: solo se devuelve el cupón.
      for (const item of venta.reservaId ? [] : items) {
        await this.inventarioSucursalService.ajustarStock({
          varianteId: item.varianteId,
          sucursalId: venta.sucursalId,
          cantidad: item.cantidad, // positivo: devuelve lo que el checkout resto
          tipoMovimiento: TipoMovimientoInventario.AJUSTE,
          motivo: `Liberacion por venta no pagada: ${motivo}`,
          usuarioId: venta.clienteId,
          manager,
        });
      }

      if (venta.cuponId) {
        await this.promocionesService.liberarCupon(venta.cuponId, manager);
      }

      // El checkout vació el carrito al crear la venta: sin esto las prendas
      // desaparecían al cancelar o vencer. Vuelven sumándose a lo que haya.
      if (venta.clienteId && !venta.reservaId) {
        await this.carritosService.devolverItems(venta.clienteId, items, manager);
      }

      venta.estado = EstadoVenta.CANCELADA;
      await ventaRepo.save(venta);
    });
  }

  /**
   * Núcleo compartido por ambos flujos de compra (carrito y reserva): resuelve
   * el precio real de cada variante, descuenta stock vía
   * InventarioSucursalService (RF20; salvo en la compra desde la reserva, que
   * descuenta al pagarse) y guarda venta + venta_items en una sola transacción.
   */
  private async registrarVenta(
    params: RegistrarVentaParams,
    managerExterno?: EntityManager,
  ): Promise<VentaResponseDto> {
    // Siempre el mismo orden de bloqueo: dos pedidos con las mismas prendas en
    // distinto orden se bloqueaban mutuamente (deadlock, 500).
    params = { ...params, items: [...params.items].sort((a, b) => a.varianteId.localeCompare(b.varianteId)) };
    const variantes = await Promise.all(
      params.items.map((item) => this.productosService.findVarianteById(item.varianteId, managerExterno)),
    );
    // No se vende lo dado de baja (el carrito puede tenerlo de antes). Lo ya
    // reservado sí: la clienta tiene la prenda apartada en la mano.
    if (!params.reservaId) {
      const inactiva = variantes.find((v) => !v.activo || !v.producto?.activo);
      if (inactiva) {
        throw new OperacionInvalidaException(
          `"${inactiva.producto?.titulo ?? 'Una prenda'}" ya no está disponible: quitala del carrito para continuar`,
        );
      }
    }

    const ejecutar = (fn: (manager: EntityManager) => Promise<VentaResponseDto>) =>
      managerExterno ? fn(managerExterno) : this.dataSource.transaction(fn);
    return ejecutar(async (manager) => {
      let subtotalCents = 0;
      const itemsAGuardar: {
        varianteId: string;
        cantidad: number;
        precioUnitCents: number;
        subtotalCents: number;
      }[] = [];

      for (let i = 0; i < params.items.length; i++) {
        const { varianteId, cantidad } = params.items[i];
        const precioUnitCents = variantes[i].producto.precioCents;
        const itemSubtotalCents = precioUnitCents * cantidad;
        subtotalCents += itemSubtotalCents;
        itemsAGuardar.push({
          varianteId,
          cantidad,
          precioUnitCents,
          subtotalCents: itemSubtotalCents,
        });

        // La compra desde la reserva descuenta al pagarse (venderLoReservado).
        if (params.reservaId) continue;
        await this.inventarioSucursalService.ajustarStock({
          varianteId,
          sucursalId: params.sucursalId,
          cantidad: -cantidad,
          tipoMovimiento: TipoMovimientoInventario.VENTA,
          usuarioId: params.clienteId,
          manager,
          // Solo se vende lo que no está apartado por una reserva.
          respetarReservadas: true,
        });
      }

      let cuponId: string | null = null;
      let descuentoCents = 0;

      if (params.codigoCupon) {
        const resultadoCupon = await this.promocionesService.consumirCupon(
          params.codigoCupon,
          subtotalCents,
          manager,
        );
        cuponId = resultadoCupon.cupon.id;
        descuentoCents = resultadoCupon.descuentoCents;
      }

      const totalCents = Math.max(0, subtotalCents - descuentoCents);

      const ventaRepo = manager.getRepository(Venta);
      const venta = await ventaRepo.save(
        ventaRepo.create({
          clienteId: params.clienteId,
          sucursalId: params.sucursalId,
          cajeroId: null, // ninguna venta nace en caja: la cajera solo confirma el cobro
          reservaId: params.reservaId ?? null,
          cuponId,
          claveIdempotencia: params.claveIdempotencia ?? null,
          canal: params.canal,
          estado: EstadoVenta.PENDIENTE,
          numeroComprobante: null,
          subtotalCents,
          descuentoCents,
          totalCents,
        }),
      );

      const itemRepo = manager.getRepository(VentaItem);
      const itemsGuardados = await itemRepo.save(
        itemsAGuardar.map((item) =>
          itemRepo.create({
            venta,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitCents: item.precioUnitCents,
            subtotalCents: item.subtotalCents,
          }),
        ),
      );

      return this.toResponse(venta, itemsGuardados);
    });
  }

  private async cargarYMapear(venta: Venta): Promise<VentaResponseDto> {
    const items = await this.ventaItemRepository.find({
      where: soloTenant({ venta: { id: venta.id } }),
    });
    return this.toResponse(venta, items);
  }

  private toResponse(venta: Venta, items: VentaItem[]): VentaResponseDto {
    return {
      id: venta.id,
      clienteId: venta.clienteId,
      sucursalId: venta.sucursalId,
      cajeroId: venta.cajeroId,
      reservaId: venta.reservaId,
      cuponId: venta.cuponId,
      canal: venta.canal,
      estado: venta.estado,
      numeroComprobante: venta.numeroComprobante,
      subtotalCents: venta.subtotalCents,
      descuentoCents: venta.descuentoCents,
      totalCents: venta.totalCents,
      createdAt: venta.createdAt,
      items: items.map((i) => ({
        id: i.id,
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        precioUnitCents: i.precioUnitCents,
        subtotalCents: i.subtotalCents,
      })),
    };
  }
}
