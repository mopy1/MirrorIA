import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { CanalVenta, EstadoVenta, type Venta } from '../entities/venta.entity.js';
import { VentasService } from './ventas.service.js';

// Compra desde la reserva (reemplaza la venta presencial, sin POS): nace
// PENDIENTE sin tocar stock; al pagarse se vende lo apartado y la reserva se
// completa; si se cancela, no se devuelve stock ni se llena el carrito.
describe('VentasService — compra desde la reserva', () => {
  const VENTA_RESERVA = {
    id: 'v1', sucursalId: 's1', clienteId: 'c1', cuponId: 'cup1', reservaId: 'r1',
    estado: EstadoVenta.PENDIENTE,
  } as Venta;

  let ventaRepo: Record<string, ReturnType<typeof vi.fn>>;
  let itemRepo: Record<string, ReturnType<typeof vi.fn>>;
  let inventario: { ajustarStock: ReturnType<typeof vi.fn> };
  let reservas: { paraComprar: ReturnType<typeof vi.fn>; completarPorVenta: ReturnType<typeof vi.fn> };
  let carritos: { devolverItems: ReturnType<typeof vi.fn> };
  let promociones: { liberarCupon: ReturnType<typeof vi.fn>; consumirCupon: ReturnType<typeof vi.fn> };
  let service: VentasService;

  beforeEach(() => {
    ventaRepo = {
      findOne: vi.fn().mockResolvedValue({ ...VENTA_RESERVA }),
      save: vi.fn((e) => ({ ...e, id: e.id ?? 'v-nueva', createdAt: new Date() })),
      create: vi.fn((e) => e),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    itemRepo = {
      find: vi.fn().mockResolvedValue([{ varianteId: 'var1', cantidad: 1 }]),
      save: vi.fn((items) => items),
      create: vi.fn((i) => i),
    };
    inventario = { ajustarStock: vi.fn() };
    reservas = {
      paraComprar: vi.fn().mockResolvedValue({ sucursalId: 's1', items: [{ varianteId: 'var1', cantidad: 1 }] }),
      completarPorVenta: vi.fn(),
    };
    carritos = { devolverItems: vi.fn() };
    promociones = { liberarCupon: vi.fn(), consumirCupon: vi.fn() };
    const manager = {
      getRepository: (e: unknown) => (String(e).includes('VentaItem') ? itemRepo : ventaRepo),
    };
    const dataSource = { transaction: (cb: (m: unknown) => unknown) => cb(manager) } as unknown as DataSource;
    const productos = {
      findVarianteById: vi.fn().mockResolvedValue({ activo: false, producto: { activo: true, precioCents: 25000 } }),
    };
    service = new VentasService(
      ventaRepo as never, itemRepo as never, dataSource, {} as never, productos as never,
      inventario as never, carritos as never, reservas as never, promociones as never,
    );
  });

  it('crea una venta PENDIENTE con los ítems de la reserva, sin descontar stock', async () => {
    const venta = await service.comprarReserva('r1', 'c1', { canal: 'MOVIL' });
    expect(reservas.paraComprar).toHaveBeenCalledWith('r1', 'c1', expect.anything());
    expect(venta).toMatchObject({
      estado: EstadoVenta.PENDIENTE, canal: CanalVenta.MOVIL, reservaId: 'r1',
      sucursalId: 's1', clienteId: 'c1', cajeroId: null, totalCents: 25000,
    });
    expect(inventario.ajustarStock).not.toHaveBeenCalled();
    expect(reservas.completarPorVenta).not.toHaveBeenCalled();
  });

  it('si la reserva no se puede comprar, no se crea ninguna venta', async () => {
    reservas.paraComprar.mockRejectedValue(new Error('no EN_TIENDA'));
    await expect(service.comprarReserva('r1', 'c1', { canal: 'WEB' })).rejects.toThrow('no EN_TIENDA');
    expect(ventaRepo.save).not.toHaveBeenCalled();
  });

  it('al pagarse vende lo apartado (un solo descuento) y completa la reserva', async () => {
    await service.marcarPagada('v1', { getRepository: (e: unknown) => (String(e).includes('VentaItem') ? itemRepo : ventaRepo) } as never);
    expect(inventario.ajustarStock).toHaveBeenCalledTimes(1);
    const params = inventario.ajustarStock.mock.calls[0][0] as Record<string, unknown>;
    expect(params).toMatchObject({ varianteId: 'var1', sucursalId: 's1', cantidad: -1, tipoMovimiento: TipoMovimientoInventario.VENTA });
    expect(params.respetarReservadas).toBeFalsy(); // son las unidades de esta reserva
    expect(reservas.completarPorVenta).toHaveBeenCalledWith('r1', 's1', expect.anything());
  });

  it('un pago repetido (venta ya PAGADA) no vuelve a descontar ni a completar', async () => {
    ventaRepo.update.mockResolvedValue({ affected: 0 });
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_RESERVA, estado: EstadoVenta.PAGADA });
    await service.marcarPagada('v1');
    expect(inventario.ajustarStock).not.toHaveBeenCalled();
    expect(reservas.completarPorVenta).not.toHaveBeenCalled();
  });

  it('cancelada o vencida: devuelve el cupón, pero no stock (sigue apartado) ni carrito', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(promociones.liberarCupon).toHaveBeenCalledWith('cup1', expect.anything());
    expect(inventario.ajustarStock).not.toHaveBeenCalled();
    expect(carritos.devolverItems).not.toHaveBeenCalled();
    expect(ventaRepo.save).toHaveBeenCalledWith(expect.objectContaining({ estado: EstadoVenta.CANCELADA }));
  });
});
