import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from '../../inventario/service/inventario-sucursal.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { CreateReservaDto } from '../dto/create-reserva.dto.js';
import type { ReservaResponseDto } from '../dto/reserva-response.dto.js';
import { EstadoReserva, Reserva } from '../entities/reserva.entity.js';
import { ReservaItem } from '../entities/reserva-item.entity.js';

// Transiciones manuales permitidas (staff). COMPLETADA se llega solo vía
// completarPorVenta — nunca desde acá. Cualquier estado no listado como
// origen es terminal (no admite más transiciones).
const TRANSICIONES_MANUALES: Partial<Record<EstadoReserva, EstadoReserva[]>> = {
  [EstadoReserva.PENDIENTE]: [
    EstadoReserva.CONFIRMADA,
    EstadoReserva.CANCELADA,
    EstadoReserva.EXPIRADA,
  ],
  [EstadoReserva.CONFIRMADA]: [
    EstadoReserva.EN_TIENDA,
    EstadoReserva.CANCELADA,
    EstadoReserva.EXPIRADA,
    EstadoReserva.NO_SHOW,
  ],
};

const ESTADOS_QUE_LIBERAN_STOCK = [
  EstadoReserva.CANCELADA,
  EstadoReserva.EXPIRADA,
  EstadoReserva.NO_SHOW,
  EstadoReserva.COMPLETADA,
];

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(ReservaItem)
    private readonly reservaItemRepository: Repository<ReservaItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly sucursalesService: SucursalesService,
    private readonly productosService: ProductosService,
    private readonly inventarioSucursalService: InventarioSucursalService,
  ) {}

  // RF09/RF10: el cliente selecciona varias prendas y las reserva en una
  // sucursal — reserva stock (cantidadReservada) sin todavía descontarlo
  // físicamente (eso pasa recién si se concreta en una venta).
  async create(dto: CreateReservaDto, clienteId: string): Promise<ReservaResponseDto> {
    await this.sucursalesService.assertExists(dto.sucursalId);
    for (const item of dto.items) {
      await this.productosService.findVarianteById(item.varianteId);
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        await this.inventarioSucursalService.ajustarReserva({
          varianteId: item.varianteId,
          sucursalId: dto.sucursalId,
          cantidad: item.cantidad,
          tipoMovimiento: TipoMovimientoInventario.RESERVA,
          usuarioId: clienteId,
          manager,
        });
      }

      const reservaRepo = manager.getRepository(Reserva);
      const reserva = await reservaRepo.save(
        reservaRepo.create({
          clienteId,
          sucursalId: dto.sucursalId,
          estado: EstadoReserva.PENDIENTE,
          fechaHoraPrevista: new Date(dto.fechaHoraPrevista),
        }),
      );

      const itemRepo = manager.getRepository(ReservaItem);
      const items = await itemRepo.save(
        dto.items.map((item) =>
          itemRepo.create({ reserva, varianteId: item.varianteId, cantidad: item.cantidad }),
        ),
      );

      return this.toResponse(reserva, items);
    });
  }

  // RF12 (cliente) + consulta interna de staff por sucursal/estado.
  async findAll(filtro: {
    clienteId?: string;
    sucursalId?: string;
    estado?: string;
  }): Promise<ReservaResponseDto[]> {
    const reservas = await this.reservaRepository.find({
      where: {
        ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
        ...(filtro.sucursalId ? { sucursalId: filtro.sucursalId } : {}),
        ...(filtro.estado ? { estado: filtro.estado as EstadoReserva } : {}),
      },
      order: { fechaHoraPrevista: 'DESC' },
    });
    return Promise.all(reservas.map((r) => this.cargarYMapear(r)));
  }

  async findOne(id: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new RecursoNoEncontradoException('Reserva', id);
    }
    return reserva;
  }

  async findOneResponse(id: string): Promise<ReservaResponseDto> {
    return this.cargarYMapear(await this.findOne(id));
  }

  // Transición manual por staff (ADMIN/ENCARGADO_SUCURSAL): confirmar,
  // marcar en tienda, cancelar por la tienda, marcar expirada o no-show.
  async cambiarEstado(id: string, nuevoEstado: EstadoReserva): Promise<ReservaResponseDto> {
    const reserva = await this.findOne(id);
    return this.dataSource.transaction((manager) =>
      this.transicionar(reserva, nuevoEstado, manager),
    );
  }

  // RF: "Consultar y cancelar reservas" — acción del propio cliente, no de
  // staff. Mismo motor de transición, pero exige que la reserva sea suya.
  async cancelar(id: string, clienteId: string): Promise<ReservaResponseDto> {
    const reserva = await this.findOne(id);
    if (reserva.clienteId !== clienteId) {
      throw new ForbiddenActionException('No podés cancelar la reserva de otro cliente');
    }
    return this.dataSource.transaction((manager) =>
      this.transicionar(reserva, EstadoReserva.CANCELADA, manager),
    );
  }

  // Llamado por VentasService cuando una venta presencial referencia una
  // reserva: la cierra y libera el stock reservado (el stock físico ya lo
  // descontó la venta por su cuenta, vía ajustarStock).
  async completarPorVenta(id: string, manager: EntityManager): Promise<void> {
    const reservaRepo = manager.getRepository(Reserva);
    const reserva = await reservaRepo.findOne({ where: { id } });
    if (!reserva) {
      throw new RecursoNoEncontradoException('Reserva', id);
    }
    if (reserva.estado !== EstadoReserva.EN_TIENDA) {
      throw new OperacionInvalidaException(
        `La reserva ${id} debe estar EN_TIENDA para completarse con una venta (está ${reserva.estado})`,
      );
    }
    await this.transicionar(reserva, EstadoReserva.COMPLETADA, manager);
  }

  private async transicionar(
    reserva: Reserva,
    nuevoEstado: EstadoReserva,
    manager: EntityManager,
  ): Promise<ReservaResponseDto> {
    const permitidos = TRANSICIONES_MANUALES[reserva.estado] ?? [];
    const esCompletarDesdeEnTienda =
      nuevoEstado === EstadoReserva.COMPLETADA && reserva.estado === EstadoReserva.EN_TIENDA;
    if (!permitidos.includes(nuevoEstado) && !esCompletarDesdeEnTienda) {
      throw new OperacionInvalidaException(
        `No se puede pasar la reserva de ${reserva.estado} a ${nuevoEstado}`,
      );
    }

    if (ESTADOS_QUE_LIBERAN_STOCK.includes(nuevoEstado)) {
      const itemRepo = manager.getRepository(ReservaItem);
      const items = await itemRepo.find({ where: { reserva: { id: reserva.id } } });
      for (const item of items) {
        await this.inventarioSucursalService.ajustarReserva({
          varianteId: item.varianteId,
          sucursalId: reserva.sucursalId,
          cantidad: -item.cantidad,
          tipoMovimiento: TipoMovimientoInventario.LIBERACION_RESERVA,
          manager,
        });
      }
    }

    reserva.estado = nuevoEstado;
    const reservaRepo = manager.getRepository(Reserva);
    const guardada = await reservaRepo.save(reserva);
    const items = await manager
      .getRepository(ReservaItem)
      .find({ where: { reserva: { id: guardada.id } } });
    return this.toResponse(guardada, items);
  }

  private async cargarYMapear(reserva: Reserva): Promise<ReservaResponseDto> {
    const items = await this.reservaItemRepository.find({
      where: { reserva: { id: reserva.id } },
    });
    return this.toResponse(reserva, items);
  }

  private toResponse(reserva: Reserva, items: ReservaItem[]): ReservaResponseDto {
    return {
      id: reserva.id,
      clienteId: reserva.clienteId,
      sucursalId: reserva.sucursalId,
      estado: reserva.estado,
      fechaHoraPrevista: reserva.fechaHoraPrevista,
      createdAt: reserva.createdAt,
      items: items.map((i) => ({ id: i.id, varianteId: i.varianteId, cantidad: i.cantidad })),
    };
  }
}
