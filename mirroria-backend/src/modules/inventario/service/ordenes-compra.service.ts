import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { CreateOrdenCompraDto } from '../dto/create-orden-compra.dto.js';
import type { OrdenCompraResponseDto } from '../dto/inventario-response.dto.js';
import type { RecibirOrdenCompraDto } from '../dto/recibir-orden-compra.dto.js';
import { EstadoOrdenCompra, OrdenCompra } from '../entities/orden-compra.entity.js';
import { TipoMovimientoInventario } from '../entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from './inventario-sucursal.service.js';

/** Fecha de hoy (YYYY-MM-DD) en Bolivia, aunque el server corra en UTC. */
function hoyBolivia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
}

@Injectable()
export class OrdenesCompraService {
  constructor(
    @InjectRepository(OrdenCompra)
    private readonly ordenRepository: Repository<OrdenCompra>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly proveedoresService: ProveedoresService,
    private readonly sucursalesService: SucursalesService,
    private readonly productosService: ProductosService,
    private readonly inventarioSucursalService: InventarioSucursalService,
  ) {}

  async create(dto: CreateOrdenCompraDto, usuarioId: string): Promise<OrdenCompraResponseDto> {
    if (new Set(dto.items.map((i) => i.varianteId)).size !== dto.items.length) {
      throw new SolicitudInvalidaException('La misma variante aparece dos veces en la orden');
    }
    if (dto.fechaEsperada && dto.fechaEsperada.slice(0, 10) < hoyBolivia()) {
      throw new SolicitudInvalidaException('La fecha esperada no puede estar en el pasado');
    }
    await this.proveedoresService.findOne(dto.proveedorId);
    await this.sucursalesService.assertExists(dto.sucursalDestinoId);
    for (const item of dto.items) {
      await this.productosService.findVarianteById(item.varianteId);
    }

    return this.dataSource.transaction(async (manager) => {
      const ordenRepo = manager.getRepository(OrdenCompra);
      const orden = await ordenRepo.save(
        ordenRepo.create({
          proveedorId: dto.proveedorId,
          sucursalDestinoId: dto.sucursalDestinoId,
          usuarioId,
          estado: EstadoOrdenCompra.PENDIENTE,
          items: dto.items.map((i) => ({
            varianteId: i.varianteId,
            cantidadPedida: i.cantidadPedida,
            cantidadRecibida: 0,
          })),
          fechaPedido: new Date(),
          fechaEsperada: dto.fechaEsperada ?? null,
          fechaRecepcion: null,
        }),
      );

      for (const item of dto.items) {
        await this.inventarioSucursalService.ajustarTransito(
          manager,
          item.varianteId,
          dto.sucursalDestinoId,
          item.cantidadPedida,
        );
      }

      return this.toResponse(orden);
    });
  }

  async findAll(): Promise<OrdenCompraResponseDto[]> {
    const ordenes = await this.ordenRepository.find({
      order: { fechaPedido: 'DESC' },
    });
    return ordenes.map((o) => this.toResponse(o));
  }

  async findOne(id: string): Promise<OrdenCompra> {
    const orden = await this.ordenRepository.findOne({ where: { id } });
    if (!orden) {
      throw new RecursoNoEncontradoException('Orden de compra', id);
    }
    return orden;
  }

  async findOneResponse(id: string): Promise<OrdenCompraResponseDto> {
    return this.toResponse(await this.findOne(id));
  }

  /** Lee la orden con FOR UPDATE: recepciones/cancelaciones simultáneas de
   * la misma orden se serializan y cada una ve lo que dejó la anterior. */
  private async bloquearAbierta(manager: EntityManager, id: string): Promise<OrdenCompra> {
    const orden = await manager
      .getRepository(OrdenCompra)
      .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!orden) {
      throw new RecursoNoEncontradoException('Orden de compra', id);
    }
    if (orden.estado === EstadoOrdenCompra.RECIBIDA || orden.estado === EstadoOrdenCompra.CANCELADA) {
      throw new OperacionInvalidaException(`La orden de compra ${id} ya está en estado ${orden.estado}`);
    }
    return orden;
  }

  /**
   * Recepción (parcial o total): por cada item mueve tránsito -> disponible
   * y registra el movimiento RECEPCION_PROVEEDOR a nombre de quien recibe
   * (RF11/RF12). Pedir más de lo pendiente es un 400, no se recorta.
   */
  async recibir(
    id: string,
    dto: RecibirOrdenCompraDto,
    usuarioId: string,
  ): Promise<OrdenCompraResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const orden = await this.bloquearAbierta(manager, id);
      for (const recepcion of dto.items) {
        const item = orden.items.find((i) => i.varianteId === recepcion.varianteId);
        if (!item) {
          throw new RecursoNoEncontradoException('Item de la orden de compra para la variante', recepcion.varianteId);
        }
        const pendiente = item.cantidadPedida - item.cantidadRecibida;
        if (recepcion.cantidadRecibida > pendiente) {
          throw new SolicitudInvalidaException(
            `Solo quedan ${pendiente} u. pendientes de la variante ${item.varianteId}`,
          );
        }
        item.cantidadRecibida += recepcion.cantidadRecibida;
        await this.inventarioSucursalService.ajustarTransito(
          manager, item.varianteId, orden.sucursalDestinoId, -recepcion.cantidadRecibida,
        );
        await this.inventarioSucursalService.ajustarStock({
          varianteId: item.varianteId,
          sucursalId: orden.sucursalDestinoId,
          cantidad: recepcion.cantidadRecibida,
          tipoMovimiento: TipoMovimientoInventario.RECEPCION_PROVEEDOR,
          ordenCompra: orden,
          usuarioId,
          manager,
        });
      }
      const completa = orden.items.every((i) => i.cantidadRecibida >= i.cantidadPedida);
      orden.estado = completa ? EstadoOrdenCompra.RECIBIDA : EstadoOrdenCompra.RECIBIDA_PARCIAL;
      if (completa) orden.fechaRecepcion = new Date();
      return this.toResponse(await manager.getRepository(OrdenCompra).save(orden));
    });
  }

  /** Cancela una orden abierta: devuelve al tránsito solo lo que faltaba
   * recibir (lo ya recibido queda en stock). Misma lock que recibir. */
  async cancelar(id: string): Promise<OrdenCompraResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const orden = await this.bloquearAbierta(manager, id);
      for (const item of orden.items) {
        const pendiente = item.cantidadPedida - item.cantidadRecibida;
        if (pendiente > 0) {
          await this.inventarioSucursalService.ajustarTransito(
            manager, item.varianteId, orden.sucursalDestinoId, -pendiente,
          );
        }
      }
      orden.estado = EstadoOrdenCompra.CANCELADA;
      return this.toResponse(await manager.getRepository(OrdenCompra).save(orden));
    });
  }

  private toResponse(orden: OrdenCompra): OrdenCompraResponseDto {
    return {
      id: orden.id,
      proveedorId: orden.proveedorId,
      sucursalDestinoId: orden.sucursalDestinoId,
      usuarioId: orden.usuarioId,
      estado: orden.estado,
      items: orden.items,
      fechaPedido: orden.fechaPedido,
      fechaEsperada: orden.fechaEsperada,
      fechaRecepcion: orden.fechaRecepcion,
    };
  }
}
