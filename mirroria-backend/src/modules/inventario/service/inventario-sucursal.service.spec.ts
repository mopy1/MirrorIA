import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { StockInsuficienteException } from '../../../core/exception/stock-insuficiente.exception.js';
import { entrarEnTenantDePrueba } from '../../../core/tenancy/tenant-context.js';
import { VarianteProducto } from '../../catalogo/entities/variante-producto.entity.js';
import type { ProductosService } from '../../catalogo/service/productos.service.js';
import { Sucursal } from '../../sucursales/entities/sucursal.entity.js';
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

// H6: el 409 STOCK_AGOTADO_CONFLICTO trae alternativas completas (con la
// conexión de la transacción, sin pedir otra al pool).
describe('InventarioSucursalService.ajustarStock — alternativas del 409', () => {
  it('otrasSucursales con nombre y otrasTallas del mismo color con stock libre', async () => {
    entrarEnTenantDePrueba('00000000-0000-0000-0000-000000000001');
    const fila = (varianteId: string, sucursalId: string, disponible: number, reservada = 0) =>
      ({ varianteId, sucursalId, cantidadDisponible: disponible, cantidadReservada: reservada });
    const invRepo = {
      createQueryBuilder: () => {
        const qb = {
          update: () => qb, set: () => qb, where: () => qb, andWhere: () => qb,
          setParameters: () => qb, execute: async () => ({ affected: 0 }),
        };
        return qb;
      },
      findOneOrFail: vi.fn().mockResolvedValue(fila('vM', 's1', 0)),
      find: vi.fn(async ({ where }: { where: { sucursalId?: string } }) =>
        where.sucursalId
          ? [fila('vL', 's1', 2), fila('vS', 's1', 1, 1)] // S: todo reservado
          : [fila('vM', 's1', 0), fila('vM', 's2', 3, 1), fila('vM', 's3', 1, 1)]),
    };
    const rojo = { id: 'rojo', nombre: 'Rojo' };
    const varRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 'vM', producto: { id: 'p1', titulo: 'Vestido' }, talla: { nombre: 'M' }, color: rojo,
      }),
      // la base ya filtra mismo producto, mismo color y activas (vAzul no viene)
      find: vi.fn().mockResolvedValue([
        { id: 'vM', talla: { nombre: 'M' } },
        { id: 'vL', talla: { nombre: 'L' } },
        { id: 'vS', talla: { nombre: 'S' } },
      ]),
    };
    const sucRepo = {
      find: vi.fn().mockResolvedValue([{ id: 's1', nombre: 'Centro' }, { id: 's2', nombre: 'Equipetrol' }]),
    };
    const manager = {
      getRepository: (e: unknown) => (e === VarianteProducto ? varRepo : e === Sucursal ? sucRepo : invRepo),
      createQueryBuilder: () => {
        const qb = { insert: () => qb, into: () => qb, values: () => qb, orIgnore: () => qb, execute: async () => ({}) };
        return qb;
      },
    };
    const productos = { findVarianteById: vi.fn().mockResolvedValue({ id: 'vM' }) };
    const sucursales = { assertExists: vi.fn() };
    const service = new InventarioSucursalService(invRepo as never, {} as never, sucursales as never, productos as never);

    const error = await service
      .ajustarStock({ varianteId: 'vM', sucursalId: 's1', cantidad: -1, tipoMovimiento: TipoMovimientoInventario.VENTA, manager: manager as never, respetarReservadas: true })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StockInsuficienteException);
    expect((error as StockInsuficienteException).detalles).toMatchObject({
      prendaNombre: 'Vestido', talla: 'M', color: 'Rojo', sucursalNombre: 'Centro',
      alternativas: {
        // s3 tiene 0 libre (1 - 1 reservada) → no aparece
        otrasSucursales: [{ sucursalId: 's2', sucursalNombre: 'Equipetrol', disponible: 2 }],
        // vS todo reservado → solo L
        otrasTallas: [{ varianteId: 'vL', talla: 'L', disponible: 2 }],
      },
    });
  });
});
