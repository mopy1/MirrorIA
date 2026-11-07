import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
import type { CreateVentaPresencialDto } from '../dto/create-venta-presencial.dto.js';
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
  precioUnitCents?: number;
}

interface RegistrarVentaParams {
  items: ItemAVender[];
  sucursalId: string;
  canal: CanalVenta;
  clienteId: string | null;
  cajeroId: string | null;
  estadoInicial: EstadoVenta;
  reservaId?: string | null;
  codigoCupon?: string | null;
  claveIdempotencia?: string | null;
  /** Venta de caja sin conexión: se registra con el precio cobrado, no con el de ahora. */
  respetarPrecioCobrado?: boolean;
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

  // Compra presencial (RF17/RF18): el cajero ya cobró en el punto de caja,
  // por eso arranca en PAGADA directo — no hay módulo `pagos` de por medio.
  // `cajeroId` viene de @CurrentUser() en el controller, no del body.
  async registrarPresencial(
    dto: CreateVentaPresencialDto,
    cajeroId: string,
    clave?: string,
  ): Promise<VentaResponseDto> {
    await this.sucursalesService.assertExists(dto.sucursalId);
    const previa = await this.ventaPorClave(clave);
    if (previa) return previa;
    if (dto.clienteId) await this.assertClientaDeLaTienda(dto.clienteId);
    return this.registrarVenta({
      items: dto.items,
      sucursalId: dto.sucursalId,
      canal: CanalVenta.PRESENCIAL,
      clienteId: dto.clienteId ?? null,
      cajeroId,
      estadoInicial: EstadoVenta.PAGADA,
      reservaId: dto.reservaId ?? null,
      codigoCupon: dto.codigoCupon ?? null,
      claveIdempotencia: clave ?? null,
      respetarPrecioCobrado: Boolean(dto.vendidaSinConexionEn),
    });
  }

  /** SQL directo: ventas no importa entidades de seguridad (regla 1). */
  private async assertClientaDeLaTienda(clienteId: string): Promise<void> {
    const filas: unknown[] = await this.dataSource.query('SELECT 1 FROM usuarios WHERE id = $1 AND tenant_id = $2', [
      clienteId,
      tenantActual(),
    ]);
    if (filas.length === 0) throw new RecursoNoEncontradoException('Clienta', clienteId);
  }

  private async ventaPorClave(clave?: string): Promise<VentaResponseDto | null> {
    if (!clave) return null;
    const venta = await this.ventaRepository.findOne({ where: soloTenant({ claveIdempotencia: clave }) });
    return venta ? this.cargarYMapear(venta) : null;
  }

  // Compra digital (RF14/RF15/RF16): arranca en PENDIENTE porque el cobro
  // real todavía depende del módulo `pagos` (no construido en este batch) —
  // ver AGENTS.md, decisión 2026-09-13.
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
          cajeroId: null,
          estadoInicial: EstadoVenta.PENDIENTE,
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
   * cobro se aprueba — por webhook de Stripe o por confirmacion de un cajero.
   *
   * Idempotente a proposito: Stripe reintenta los webhooks, y una venta que ya
   * esta PAGADA tiene que quedarse quieta en vez de fallar. Pero una venta
   * CANCELADA si es un error: significa que su stock ya volvio al inventario y
   * cobrarla dejaria vendida mercaderia que el sistema cree tener.
   */
  async marcarPagada(ventaId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Venta) : this.ventaRepository;
    // UPDATE condicionado a PENDIENTE, no "leer y guardar": un pago tardío
    // leía PENDIENTE, la expiración cancelaba (devolviendo stock y cupón) y el
    // save pisaba CANCELADA con PAGADA. Si la cancelación tiene la fila
    // bloqueada, este UPDATE espera y luego no encuentra PENDIENTE.
    const { affected } = await repo.update(
      soloTenant({ id: ventaId, estado: EstadoVenta.PENDIENTE }),
      { estado: EstadoVenta.PAGADA, numeroComprobante: comprobanteDe(ventaId) },
    );
    if (affected === 1) return;
    const venta = await repo.findOne({ where: soloTenant({ id: ventaId }) });
    if (!venta) {
      throw new RecursoNoEncontradoException('Venta', ventaId);
    }
    if (venta.estado === EstadoVenta.PAGADA) {
      return;
    }
    throw new OperacionInvalidaException(`No se puede cobrar una venta en estado ${venta.estado}`);
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

      for (const item of items) {
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
      if (venta.clienteId) {
        await this.carritosService.devolverItems(venta.clienteId, items, manager);
      }

      venta.estado = EstadoVenta.CANCELADA;
      await ventaRepo.save(venta);
    });
  }

  /**
   * Núcleo compartido por ambos flujos de compra: resuelve el precio real de
   * cada variante, descuenta stock vía InventarioSucursalService (RF20 — acá
   * es donde el inventario se actualiza automáticamente), y guarda
   * venta + venta_items en una sola transacción.
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
    // Online no se vende lo dado de baja (el carrito puede tenerlo de antes).
    if (params.canal !== CanalVenta.PRESENCIAL) {
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
        const { varianteId, cantidad, precioUnitCents: cobrado } = params.items[i];
        const precioUnitCents =
          params.respetarPrecioCobrado && cobrado !== undefined ? cobrado : variantes[i].producto.precioCents;
        const itemSubtotalCents = precioUnitCents * cantidad;
        subtotalCents += itemSubtotalCents;
        itemsAGuardar.push({
          varianteId,
          cantidad,
          precioUnitCents,
          subtotalCents: itemSubtotalCents,
        });

        await this.inventarioSucursalService.ajustarStock({
          varianteId,
          sucursalId: params.sucursalId,
          cantidad: -cantidad,
          tipoMovimiento: TipoMovimientoInventario.VENTA,
          usuarioId: params.cajeroId ?? params.clienteId ?? null,
          manager,
          // Sin reserva, solo se vende lo que no está apartado.
          respetarReservadas: !params.reservaId,
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
      // id generado acá (no por la BD) para poder derivar el comprobante de la
      // venta presencial, que nace PAGADA, en el mismo INSERT.
      const id = randomUUID();
      const venta = await ventaRepo.save(
        ventaRepo.create({
          id,
          clienteId: params.clienteId,
          sucursalId: params.sucursalId,
          cajeroId: params.cajeroId,
          reservaId: params.reservaId ?? null,
          cuponId,
          claveIdempotencia: params.claveIdempotencia ?? null,
          canal: params.canal,
          estado: params.estadoInicial,
          numeroComprobante:
            params.estadoInicial === EstadoVenta.PAGADA ? comprobanteDe(id) : null,
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

      // La venta ya descontó cantidadDisponible arriba (ajustarStock, RF20).
      // Si concreta una reserva, cerrarla libera su cantidadReservada.
      if (params.reservaId) {
        await this.reservasService.completarPorVenta(params.reservaId, params.sucursalId, manager);
      }

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
