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
  /**
   * Al restar, exige que alcance lo NO reservado (disponible - reservada). Lo
   * piden las ventas que no concretan una reserva: no pueden llevarse unidades
   * apartadas por otra clienta.
   */
  respetarReservadas?: boolean;
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
    // Sin transacción del llamador (ajuste manual) se abre una: stock y
    // movimiento quedan juntos o no queda ninguno.
    if (!params.manager) {
      return this.dataSource.transaction((manager) => this.ajustarStock({ ...params, manager }));
    }
    await this.sucursalesService.assertExists(params.sucursalId);
    await this.productosService.findVarianteById(params.varianteId);

    const manager = params.manager;
    const invRepo = manager.getRepository(InventarioSucursal);
    const donde = { varianteId: params.varianteId, sucursalId: params.sucursalId };
    await this.asegurarFila(manager, params.varianteId, params.sucursalId);

    // UPDATE atómico condicionado, no "leer, sumar y guardar": con checkouts
    // simultáneos todos leían el mismo número y se pisaban (6 ventas de 1 u.
    // bajaban 2). La base aplica los deltas uno tras otro y rechaza el que
    // dejaría el stock en negativo. Una venta que no concreta una reserva
    // tampoco puede llevarse unidades apartadas por otra clienta.
    const libre = params.respetarReservadas
      ? 'cantidad_disponible - cantidad_reservada'
      : 'cantidad_disponible';
    const qb = invRepo
      .createQueryBuilder()
      .update(InventarioSucursal)
      .set({ cantidadDisponible: () => 'cantidad_disponible + :delta' })
      .where('variante_id = :varianteId AND sucursal_id = :sucursalId');
    if (params.cantidad < 0) {
      qb.andWhere(`${libre} + :delta >= 0`);
    }
    const { affected } = await qb
      .setParameters({ ...donde, delta: params.cantidad })
      .execute();
    if (affected !== 1) {
      const actual = await invRepo.findOneOrFail({ where: donde });
      throw new StockInsuficienteException(
        params.varianteId,
        params.sucursalId,
        params.respetarReservadas
          ? actual.cantidadDisponible - actual.cantidadReservada
          : actual.cantidadDisponible,
        -params.cantidad,
      );
    }
    const fila = await invRepo.findOneOrFail({ where: donde });

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

  /** Crea la fila en 0 si no existe; si otra transacción la crea a la vez, no falla. */
  private async asegurarFila(
    manager: EntityManager,
    varianteId: string,
    sucursalId: string,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(InventarioSucursal)
      .values({ varianteId, sucursalId, cantidadDisponible: 0, cantidadReservada: 0, cantidadEnTransito: 0 })
      .orIgnore()
      .execute();
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
    // Atómico por la misma razón que ajustarStock.
    await this.asegurarFila(manager, varianteId, sucursalId);
    await manager
      .createQueryBuilder()
      .update(InventarioSucursal)
      .set({ cantidadEnTransito: () => 'GREATEST(0, cantidad_en_transito + :delta)' })
      .where('variante_id = :varianteId AND sucursal_id = :sucursalId')
      .setParameters({ varianteId, sucursalId, delta })
      .execute();
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
