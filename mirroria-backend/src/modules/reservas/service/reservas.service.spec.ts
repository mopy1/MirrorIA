import type { DataSource, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TENANT_PRUEBA } from '../../../../vitest.setup.js';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import type { ProductosService } from '../../catalogo/service/productos.service.js';
import type { InventarioSucursalService } from '../../inventario/service/inventario-sucursal.service.js';
import type { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import { EstadoReserva, type Reserva } from '../entities/reserva.entity.js';
import type { ReservaItem } from '../entities/reserva-item.entity.js';
import { ReservasService } from './reservas.service.js';

describe('ReservasService — concurrencia y disponibilidad', () => {
  let reservaRepo: { findOne: ReturnType<typeof vi.fn>; find: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let itemRepo: { find: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let manager: { getRepository: (e: unknown) => unknown; query: ReturnType<typeof vi.fn> };
  let inventario: { ajustarReserva: ReturnType<typeof vi.fn> };
  let productos: { findVarianteById: ReturnType<typeof vi.fn> };
  let service: ReservasService;

  beforeEach(() => {
    reservaRepo = {
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn((r) => ({ ...r, id: r.id ?? 'r-nueva' })),
      create: vi.fn((r) => r),
    };
    itemRepo = { find: vi.fn().mockResolvedValue([{ varianteId: 'v1', cantidad: 1 }]), save: vi.fn((i) => i), create: vi.fn((i) => i) };
    manager = {
      getRepository: (e) => (String(e).includes('ReservaItem') ? itemRepo : reservaRepo),
      query: vi.fn(),
    };
    inventario = { ajustarReserva: vi.fn() };
    productos = {
      findVarianteById: vi.fn().mockResolvedValue({ activo: true, producto: { activo: true, titulo: 'Vestido' } }),
    };
    const dataSource = { transaction: (fn: (m: unknown) => unknown) => fn(manager) };
    service = new ReservasService(
      reservaRepo as unknown as Repository<Reserva>,
      itemRepo as unknown as Repository<ReservaItem>,
      dataSource as unknown as DataSource,
      { assertExists: vi.fn() } as unknown as SucursalesService,
      productos as unknown as ProductosService,
      inventario as unknown as InventarioSucursalService,
    );
  });

  const dto = () => ({
    sucursalId: 's1',
    fechaHoraPrevista: new Date(Date.now() + 2 * 3600_000).toISOString(),
    items: [{ varianteId: 'v1', cantidad: 1 }],
  });

  it('cambiarEstado relee con pessimistic_write: si ya la cancelaron, 409 y no libera stock dos veces', async () => {
    reservaRepo.findOne.mockResolvedValue({ id: 'r1', estado: EstadoReserva.CANCELADA, sucursalId: 's1' });
    await expect(service.cambiarEstado('r1', EstadoReserva.CANCELADA)).rejects.toBeInstanceOf(OperacionInvalidaException);
    expect(reservaRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
    expect(inventario.ajustarReserva).not.toHaveBeenCalled();
  });

  it('cancelar (clienta) también relee con lock dentro de la transacción', async () => {
    reservaRepo.findOne.mockResolvedValue({ id: 'r1', clienteId: 'c1', estado: EstadoReserva.PENDIENTE, sucursalId: 's1' });
    const r = await service.cancelar('r1', 'c1');
    expect(r.estado).toBe(EstadoReserva.CANCELADA);
    expect(reservaRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
    expect(inventario.ajustarReserva).toHaveBeenCalledTimes(1);
  });

  it('el cupo se revisa dentro de la tx con la fila de la clienta bloqueada (FOR UPDATE)', async () => {
    reservaRepo.count.mockResolvedValue(2); // la otra petición simultánea ya commiteó
    await expect(service.create(dto(), 'c1')).rejects.toBeInstanceOf(ForbiddenActionException);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringMatching(/FROM usuarios .*tenant_id = \$2 FOR UPDATE/),
      ['c1', TENANT_PRUEBA],
    );
    expect(inventario.ajustarReserva).not.toHaveBeenCalled();
  });

  it('no se reserva un producto o variante inactiva (409)', async () => {
    productos.findVarianteById.mockResolvedValue({ activo: true, producto: { activo: false, titulo: 'Vestido' } });
    await expect(service.create(dto(), 'c1')).rejects.toThrow(/ya no está disponible/);
    productos.findVarianteById.mockResolvedValue({ activo: false, producto: { activo: true, titulo: 'Vestido' } });
    await expect(service.create(dto(), 'c1')).rejects.toBeInstanceOf(OperacionInvalidaException);
  });

  it('con cupo libre crea la reserva', async () => {
    const r = await service.create(dto(), 'c1');
    expect(r.estado).toBe(EstadoReserva.PENDIENTE);
    expect(inventario.ajustarReserva).toHaveBeenCalledTimes(1);
  });
});
