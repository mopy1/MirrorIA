import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { soloTenant } from '../../../core/tenancy/tenant-context.js';
import type { MovimientoInventarioResponseDto } from '../dto/inventario-response.dto.js';
import { MovimientoInventario } from '../entities/movimiento-inventario.entity.js';

@Injectable()
export class MovimientosInventarioService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepository: Repository<MovimientoInventario>,
  ) {}

  async findAll(filtro: {
    varianteId?: string;
    sucursalId?: string;
  }): Promise<MovimientoInventarioResponseDto[]> {
    const movimientos = await this.movimientoRepository.find({
      where: soloTenant({
        ...(filtro.varianteId ? { varianteId: filtro.varianteId } : {}),
        ...(filtro.sucursalId ? { sucursalId: filtro.sucursalId } : {}),
      }),
      relations: { ordenCompra: true },
      order: { fecha: 'DESC' },
    });
    return movimientos.map((m) => ({
      id: m.id,
      varianteId: m.varianteId,
      sucursalId: m.sucursalId,
      tipoMovimiento: m.tipoMovimiento,
      cantidad: m.cantidad,
      ordenCompraId: m.ordenCompra?.id ?? null,
      ventaItemId: m.ventaItemId,
      motivo: m.motivo,
      referenciaDoc: m.referenciaDoc,
      fecha: m.fecha,
    }));
  }
}
