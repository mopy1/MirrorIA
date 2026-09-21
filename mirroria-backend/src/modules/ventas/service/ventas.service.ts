import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
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
import { CarritosService } from './carritos.service.js';

interface ItemAVender {
  varianteId: string;
  cantidad: number;
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
  ): Promise<VentaResponseDto> {
    await this.sucursalesService.assertExists(dto.sucursalId);
    return this.registrarVenta({
      items: dto.items,
      sucursalId: dto.sucursalId,
      canal: CanalVenta.PRESENCIAL,
      clienteId: dto.clienteId ?? null,
      cajeroId,
      estadoInicial: EstadoVenta.PAGADA,
      reservaId: dto.reservaId ?? null,
      codigoCupon: dto.codigoCupon ?? null,
    });
  }

  // Compra digital (RF14/RF15/RF16): arranca en PENDIENTE porque el cobro
  // real todavía depende del módulo `pagos` (no construido en este batch) —
  // ver AGENTS.md, decisión 2026-09-13.
  async checkoutCarrito(usuarioId: string, dto: CheckoutCarritoDto): Promise<VentaResponseDto> {
    await this.sucursalesService.assertExists(dto.sucursalId);
    const carrito = await this.carritosService.findOrCreateActivo(usuarioId);
    if (carrito.items.length === 0) {
      throw new OperacionInvalidaException(
        'El carrito está vacío, no se puede completar la compra',
      );
    }

    const venta = await this.registrarVenta({
      items: carrito.items,
      sucursalId: dto.sucursalId,
      canal: dto.canal === 'WEB' ? CanalVenta.WEB : CanalVenta.MOVIL,
      clienteId: usuarioId,
      cajeroId: null,
      estadoInicial: EstadoVenta.PENDIENTE,
      codigoCupon: dto.codigoCupon ?? null,
    });

    await this.carritosService.vaciar(usuarioId);
    return venta;
  }

  async findAll(filtro: { sucursalId?: string }): Promise<VentaResponseDto[]> {
    const ventas = await this.ventaRepository.find({
      where: filtro.sucursalId ? { sucursalId: filtro.sucursalId } : {},
      order: { createdAt: 'DESC' },
    });
    return Promise.all(ventas.map((venta) => this.cargarYMapear(venta)));
  }

  async findOne(id: string): Promise<VentaResponseDto> {
    const venta = await this.ventaRepository.findOne({ where: { id } });
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
    const venta = await repo.findOne({ where: { id: ventaId } });
    if (!venta) {
      throw new RecursoNoEncontradoException('Venta', ventaId);
    }
    if (venta.estado === EstadoVenta.PAGADA) {
      return;
    }
    if (venta.estado !== EstadoVenta.PENDIENTE) {
      throw new OperacionInvalidaException(
        `No se puede cobrar una venta en estado ${venta.estado}`,
      );
    }
    venta.estado = EstadoVenta.PAGADA;
    await repo.save(venta);
  }

  /**
   * Deshace un checkout que nunca se pago: devuelve el stock, devuelve el uso del
   * cupon y deja la venta CANCELADA. Todo en una transaccion: o se deshacen las
   * dos cosas o no se deshace ninguna.
   *
   * El movimiento se registra como AJUSTE y no como DEVOLUCION porque la
   * mercaderia nunca salio — nadie pago ni retiro nada. Llamarlo devolucion
   * inflaria la metrica de devoluciones con ventas que jamas ocurrieron.
   */
  async cancelarPorPagoNoCompletado(ventaId: string, motivo: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const ventaRepo = manager.getRepository(Venta);
      const venta = await ventaRepo.findOne({ where: { id: ventaId } });
      if (!venta) {
        throw new RecursoNoEncontradoException('Venta', ventaId);
      }
      if (venta.estado !== EstadoVenta.PENDIENTE) {
        throw new OperacionInvalidaException(
          `Solo se cancela una venta PENDIENTE, y esta esta en ${venta.estado}`,
        );
      }

      const items = await manager.getRepository(VentaItem).find({
        where: { venta: { id: ventaId } },
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
  private async registrarVenta(params: RegistrarVentaParams): Promise<VentaResponseDto> {
    const variantes = await Promise.all(
      params.items.map((item) => this.productosService.findVarianteById(item.varianteId)),
    );

    return this.dataSource.transaction(async (manager) => {
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

        await this.inventarioSucursalService.ajustarStock({
          varianteId,
          sucursalId: params.sucursalId,
          cantidad: -cantidad,
          tipoMovimiento: TipoMovimientoInventario.VENTA,
          usuarioId: params.cajeroId ?? params.clienteId ?? null,
          manager,
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
          cajeroId: params.cajeroId,
          reservaId: params.reservaId ?? null,
          cuponId,
          canal: params.canal,
          estado: params.estadoInicial,
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

      // La venta ya descontó cantidadDisponible arriba (ajustarStock, RF20).
      // Si concreta una reserva, cerrarla libera su cantidadReservada.
      if (params.reservaId) {
        await this.reservasService.completarPorVenta(params.reservaId, manager);
      }

      return this.toResponse(venta, itemsGuardados);
    });
  }

  private async cargarYMapear(venta: Venta): Promise<VentaResponseDto> {
    const items = await this.ventaItemRepository.find({ where: { venta: { id: venta.id } } });
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
