import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { StockInsuficienteException } from '../../../core/exception/stock-insuficiente.exception.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { InventarioSucursalResponseDto } from '../dto/inventario-response.dto.js';
import { InventarioSucursal } from '../entities/inventario-sucursal.entity.js';
import type { OrdenCompra } from '../entities/orden-compra.entity.js';
import {
  MovimientoInventario,
  TipoMovimientoInventario,
} from '../entities/movimiento-inventario.entity.js';

export interface AjustarReservaParams {
  varianteId: string;
  sucursalId: string;
  /** Delta sobre cantidadReservada: positivo reserva, negativo libera. */
  cantidad: number;
  tipoMovimiento: TipoMovimientoInventario.RESERVA | TipoMovimientoInventario.LIBERACION_RESERVA;
  usuarioId?: string | null;
  manager?: EntityManager;
  /**
   * Tope opcional de cuánto del stock disponible puede estar reservado a la
   * vez (0..1, redondeando hacia arriba). Lo decide quien reserva — acá solo
   * se aplica, porque es el único lugar que ve los números con la fila bloqueada.
   */
  fraccionMaximaReservable?: number;
}

export interface AjustarStockParams {
  varianteId: string;
  sucursalId: string;
  /** Delta sobre cantidadDisponible: positivo suma, negativo resta. */
  cantidad: number;
  tipoMovimiento: TipoMovimientoInventario;
  motivo?: string | null;
  ventaItemId?: string | null;
  ordenCompra?: OrdenCompra | null;
  usuarioId?: string | null;
  /** Para participar de una transacción ya abierta por el llamador (ventas, ordenes-compra). */
  manager?: EntityManager;
}

@Injectable()
export class InventarioSucursalService {
  constructor(
    @InjectRepository(InventarioSucursal)
    private readonly inventarioRepository: Repository<InventarioSucursal>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly sucursalesService: SucursalesService,
    private readonly productosService: ProductosService,
  ) {}

  async findAll(filtro: {
    varianteId?: string;
    sucursalId?: string;
  }): Promise<InventarioSucursalResponseDto[]> {
    const filas = await this.inventarioRepository.find({
      where: {
        ...(filtro.varianteId ? { varianteId: filtro.varianteId } : {}),
        ...(filtro.sucursalId ? { sucursalId: filtro.sucursalId } : {}),
      },
    });
    return filas.map((f) => this.toResponse(f));
  }

  /**
   * Punto de entrada único para mover `cantidadDisponible`: valida que la
   * variante y la sucursal existan, aplica el delta, rechaza si el resultado
   * quedaría negativo, y deja registrado el MovimientoInventario
   * correspondiente. Ventas y la recepción de ordenes_compra pasan por acá —
   * ninguna otra ruta debe tocar cantidadDisponible directamente.
   */
  async ajustarStock(params: AjustarStockParams): Promise<InventarioSucursal> {
    await this.sucursalesService.assertExists(params.sucursalId);
    await this.productosService.findVarianteById(params.varianteId);

    const manager = params.manager ?? this.dataSource.manager;
    const invRepo = manager.getRepository(InventarioSucursal);

    let fila = await invRepo.findOne({
      where: { varianteId: params.varianteId, sucursalId: params.sucursalId },
    });
    if (!fila) {
      fila = invRepo.create({
        varianteId: params.varianteId,
        sucursalId: params.sucursalId,
        cantidadDisponible: 0,
        cantidadReservada: 0,
        cantidadEnTransito: 0,
      });
    }

    const nuevaCantidad = fila.cantidadDisponible + params.cantidad;
    if (nuevaCantidad < 0) {
      throw new StockInsuficienteException(
        params.varianteId,
        params.sucursalId,
        fila.cantidadDisponible,
        -params.cantidad,
      );
    }
    fila.cantidadDisponible = nuevaCantidad;
    fila = await invRepo.save(fila);

    const movRepo = manager.getRepository(MovimientoInventario);
    await movRepo.save(
      movRepo.create({
        varianteId: params.varianteId,
        sucursalId: params.sucursalId,
        tipoMovimiento: params.tipoMovimiento,
        cantidad: params.cantidad,
        ordenCompra: params.ordenCompra ?? null,
        ventaItemId: params.ventaItemId ?? null,
        motivo: params.motivo ?? null,
        usuarioId: params.usuarioId ?? null,
      }),
    );

    return fila;
  }

  /**
   * Punto de entrada único para mover `cantidadReservada` (RF09-12,
   * reservas). Reservar (`cantidad` positivo) valida que no se reserve más
   * de lo que hay disponible ahora (`cantidadDisponible - cantidadReservada`
   * es la disponibilidad real "para llevar hoy"); liberar (`cantidad`
   * negativo, al cancelar/expirar/completar una reserva) nunca deja el
   * contador en negativo. `cantidadDisponible` no se toca acá — reservar no
   * saca stock físico, solo lo aparta; el stock físico recién baja cuando la
   * reserva se concreta en una venta (ver `ventas.registrarPresencial` con
   * `reservaId`).
   */
  async ajustarReserva(params: AjustarReservaParams): Promise<InventarioSucursal> {
    await this.sucursalesService.assertExists(params.sucursalId);
    await this.productosService.findVarianteById(params.varianteId);

    const manager = params.manager ?? this.dataSource.manager;
    const invRepo = manager.getRepository(InventarioSucursal);

    // Dentro de una transacción se bloquea la fila: sin esto dos reservas
    // simultáneas leían el mismo `cantidadReservada` y apartaban la misma unidad.
    let fila = await invRepo.findOne({
      where: { varianteId: params.varianteId, sucursalId: params.sucursalId },
      ...(params.manager ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!fila) {
      fila = invRepo.create({
        varianteId: params.varianteId,
        sucursalId: params.sucursalId,
        cantidadDisponible: 0,
        cantidadReservada: 0,
        cantidadEnTransito: 0,
      });
    }

    if (params.cantidad > 0) {
      let disponibleReal = fila.cantidadDisponible - fila.cantidadReservada;
      if (params.fraccionMaximaReservable !== undefined) {
        const tope = Math.ceil(fila.cantidadDisponible * params.fraccionMaximaReservable);
        disponibleReal = Math.min(disponibleReal, tope - fila.cantidadReservada);
      }
      if (params.cantidad > disponibleReal) {
        throw new StockInsuficienteException(
          params.varianteId,
          params.sucursalId,
          disponibleReal,
          params.cantidad,
        );
      }
    }
    fila.cantidadReservada = Math.max(0, fila.cantidadReservada + params.cantidad);
    fila = await invRepo.save(fila);

    const movRepo = manager.getRepository(MovimientoInventario);
    await movRepo.save(
      movRepo.create({
        varianteId: params.varianteId,
        sucursalId: params.sucursalId,
        tipoMovimiento: params.tipoMovimiento,
        cantidad: params.cantidad,
        usuarioId: params.usuarioId ?? null,
      }),
    );

    return fila;
  }

  /**
   * Mueve solo cantidadEnTransito, sin escribir MovimientoInventario (el
   * movimiento real se registra recién cuando la mercadería se recibe, vía
   * ajustarStock con tipo RECEPCION_PROVEEDOR). Uso interno de
   * OrdenesCompraService — variante/sucursal ya validadas ahí.
   */
  async ajustarTransito(
    manager: EntityManager,
    varianteId: string,
    sucursalId: string,
    delta: number,
  ): Promise<void> {
    const invRepo = manager.getRepository(InventarioSucursal);
    let fila = await invRepo.findOne({ where: { varianteId, sucursalId } });
    if (!fila) {
      fila = invRepo.create({
        varianteId,
        sucursalId,
        cantidadDisponible: 0,
        cantidadReservada: 0,
        cantidadEnTransito: 0,
      });
    }
    fila.cantidadEnTransito = Math.max(0, fila.cantidadEnTransito + delta);
    await invRepo.save(fila);
  }

  private toResponse(fila: InventarioSucursal): InventarioSucursalResponseDto {
    return {
      id: fila.id,
      varianteId: fila.varianteId,
      sucursalId: fila.sucursalId,
      cantidadDisponible: fila.cantidadDisponible,
      cantidadReservada: fila.cantidadReservada,
      cantidadEnTransito: fila.cantidadEnTransito,
    };
  }
}
