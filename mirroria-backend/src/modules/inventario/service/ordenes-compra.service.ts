import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
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

  async create(dto: CreateOrdenCompraDto): Promise<OrdenCompraResponseDto> {
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
          usuarioId: dto.usuarioId,
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

  /**
   * Recepción (parcial o total) de una orden de compra: por cada item
   * recibido, mueve cantidadEnTransito -> cantidadDisponible y registra el
   * MovimientoInventario RECEPCION_PROVEEDOR correspondiente (RF11/RF12).
   * Recalcula el estado de la orden según cuánto se recibió en total.
   */
  async recibir(
    id: string,
    dto: RecibirOrdenCompraDto,
  ): Promise<OrdenCompraResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const ordenRepo = manager.getRepository(OrdenCompra);
      const orden = await ordenRepo.findOne({ where: { id } });
      if (!orden) {
        throw new RecursoNoEncontradoException('Orden de compra', id);
      }
      if (
        orden.estado === EstadoOrdenCompra.RECIBIDA ||
        orden.estado === EstadoOrdenCompra.CANCELADA
      ) {
        throw new OperacionInvalidaException(
          `La orden de compra ${id} ya está en estado ${orden.estado}, no se puede recibir mercadería`,
        );
      }

      for (const recepcion of dto.items) {
        const item = orden.items.find((i) => i.varianteId === recepcion.varianteId);
        if (!item) {
          throw new RecursoNoEncontradoException(
            'Item de la orden de compra para la variante',
            recepcion.varianteId,
          );
        }

        const pendiente = item.cantidadPedida - item.cantidadRecibida;
        const aRecibir = Math.min(recepcion.cantidadRecibida, pendiente);
        if (aRecibir <= 0) {
          continue;
        }

        item.cantidadRecibida += aRecibir;

        await this.inventarioSucursalService.ajustarTransito(
          manager,
          item.varianteId,
          orden.sucursalDestinoId,
          -aRecibir,
        );
        await this.inventarioSucursalService.ajustarStock({
          varianteId: item.varianteId,
          sucursalId: orden.sucursalDestinoId,
          cantidad: aRecibir,
          tipoMovimiento: TipoMovimientoInventario.RECEPCION_PROVEEDOR,
          ordenCompra: orden,
          usuarioId: orden.usuarioId,
          manager,
        });
      }

      const totalPedido = orden.items.reduce((sum, i) => sum + i.cantidadPedida, 0);
      const totalRecibido = orden.items.reduce((sum, i) => sum + i.cantidadRecibida, 0);
      orden.estado =
        totalRecibido >= totalPedido
          ? EstadoOrdenCompra.RECIBIDA
          : EstadoOrdenCompra.RECIBIDA_PARCIAL;
      if (orden.estado === EstadoOrdenCompra.RECIBIDA) {
        orden.fechaRecepcion = new Date();
      }

      const guardada = await ordenRepo.save(orden);
      return this.toResponse(guardada);
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
