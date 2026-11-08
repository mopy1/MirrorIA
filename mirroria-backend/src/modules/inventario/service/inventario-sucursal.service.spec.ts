import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { entrarEnTenantDePrueba } from '../../../core/tenancy/tenant-context.js';
import type { ProductosService } from '../../catalogo/service/productos.service.js';
import type { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { InventarioSucursal } from '../entities/inventario-sucursal.entity.js';
import { TipoMovimientoInventario } from '../entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from './inventario-sucursal.service.js';

describe('ajustarStock dentro de una transaccion', () => {
  it('valida con la conexion de la transaccion: pedir otra al pool lo colgaba todo', async () => {
    entrarEnTenantDePrueba('00000000-0000-0000-0000-000000000001');
    const qb = {
      insert: vi.fn().mockReturnThis(), into: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(),
      orIgnore: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), setParameters: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const repo = {
      createQueryBuilder: vi.fn(() => qb), findOneOrFail: vi.fn().mockResolvedValue({}),
      create: vi.fn((x) => x), save: vi.fn(async (x) => x),
    };
    const manager = { getRepository: vi.fn(() => repo), createQueryBuilder: vi.fn(() => qb) } as unknown as EntityManager;
    const sucursales = { assertExists: vi.fn().mockResolvedValue(undefined) };
    const productos = { findVarianteById: vi.fn().mockResolvedValue({}) };
    const service = new InventarioSucursalService(
      repo as unknown as Repository<InventarioSucursal>,
      {} as DataSource,
      sucursales as unknown as SucursalesService,
      productos as unknown as ProductosService,
    );

    await service.ajustarStock({
      varianteId: 'v1', sucursalId: 's1', cantidad: -1,
      tipoMovimiento: TipoMovimientoInventario.VENTA, usuarioId: null, manager,
    });

    expect(sucursales.assertExists).toHaveBeenCalledWith('s1', manager);
    expect(productos.findVarianteById).toHaveBeenCalledWith('v1', manager);
  });
});
