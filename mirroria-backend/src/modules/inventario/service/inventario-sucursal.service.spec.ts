import { describe, expect, it, vi } from 'vitest';
import { StockInsuficienteException } from '../../../core/exception/stock-insuficiente.exception.js';
import { TipoMovimientoInventario } from '../entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from './inventario-sucursal.service.js';

// H6: el 409 STOCK_AGOTADO_CONFLICTO trae alternativas completas.
describe('InventarioSucursalService.ajustarStock — alternativas del 409', () => {
  it('otrasSucursales con nombre y otrasTallas del mismo color con stock libre', async () => {
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
    const manager = {
      getRepository: () => invRepo,
      createQueryBuilder: () => {
        const qb = { insert: () => qb, into: () => qb, values: () => qb, orIgnore: () => qb, execute: async () => ({}) };
        return qb;
      },
    };
    const productos = {
      findVarianteById: vi.fn().mockResolvedValue({ id: 'vM', producto: { id: 'p1' } }),
      findOne: vi.fn().mockResolvedValue({
        titulo: 'Vestido',
        variantes: [
          { id: 'vM', tallaNombre: 'M', colorId: 'rojo', colorNombre: 'Rojo', activo: true },
          { id: 'vL', tallaNombre: 'L', colorId: 'rojo', colorNombre: 'Rojo', activo: true },
          { id: 'vS', tallaNombre: 'S', colorId: 'rojo', colorNombre: 'Rojo', activo: true },
          { id: 'vAzul', tallaNombre: 'M', colorId: 'azul', colorNombre: 'Azul', activo: true },
        ],
      }),
    };
    const sucursales = {
      assertExists: vi.fn(),
      findAll: vi.fn().mockResolvedValue([{ id: 's1', nombre: 'Centro' }, { id: 's2', nombre: 'Equipetrol' }]),
    };
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
        // vS todo reservado y vAzul es otro color → solo L
        otrasTallas: [{ varianteId: 'vL', talla: 'L', disponible: 2 }],
      },
    });
  });
});
