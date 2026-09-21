import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { VentasService } from './ventas.service.js';
import { EstadoVenta, Venta } from '../entities/venta.entity.js';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';

describe('VentasService — cobro y cancelacion', () => {
  let ventaRepo: { findOne: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let itemRepo: { find: ReturnType<typeof vi.fn> };
  let inventario: { ajustarStock: ReturnType<typeof vi.fn> };
  let promociones: { liberarCupon: ReturnType<typeof vi.fn> };
  let service: VentasService;

  const VENTA_BASE = {
    id: 'v1', sucursalId: 's1', clienteId: 'c1', cuponId: null,
    estado: EstadoVenta.PENDIENTE,
  } as Venta;

  beforeEach(() => {
    ventaRepo = { findOne: vi.fn().mockResolvedValue({ ...VENTA_BASE }), save: vi.fn((e) => e) };
    itemRepo = { find: vi.fn().mockResolvedValue([{ varianteId: 'var1', cantidad: 3 }]) };
    inventario = { ajustarStock: vi.fn() };
    promociones = { liberarCupon: vi.fn() };

    const manager = {
      getRepository: (entidad: unknown) =>
        String(entidad).includes('VentaItem') ? itemRepo : ventaRepo,
    };
    const dataSource = {
      transaction: (cb: (m: unknown) => unknown) => cb(manager),
      manager,
    } as unknown as DataSource;

    // Orden real del constructor (ver ventas.service.ts): ventaRepository,
    // ventaItemRepository, dataSource, sucursalesService, productosService,
    // inventarioSucursalService, carritosService, reservasService,
    // promocionesService.
    service = new VentasService(
      ventaRepo as never, // ventaRepository
      itemRepo as never, // ventaItemRepository
      dataSource,
      {} as never, // sucursalesService
      {} as never, // productosService
      inventario as never, // inventarioSucursalService
      {} as never, // carritosService
      {} as never, // reservasService
      promociones as never, // promocionesService
    );
  });

  it('marcarPagada lleva una venta PENDIENTE a PAGADA', async () => {
    await service.marcarPagada('v1');
    expect(ventaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoVenta.PAGADA }),
    );
  });

  it('marcarPagada es idempotente: una venta ya PAGADA no se toca ni falla', async () => {
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, estado: EstadoVenta.PAGADA });
    await service.marcarPagada('v1');
    expect(ventaRepo.save).not.toHaveBeenCalled();
  });

  it('marcarPagada sobre una venta CANCELADA es un error de negocio', async () => {
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, estado: EstadoVenta.CANCELADA });
    await expect(service.marcarPagada('v1')).rejects.toThrow(OperacionInvalidaException);
  });

  it('cancelar devuelve al inventario lo que el checkout descontó', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(inventario.ajustarStock).toHaveBeenCalledWith(
      expect.objectContaining({
        varianteId: 'var1',
        sucursalId: 's1',
        cantidad: 3, // POSITIVO: el checkout habia puesto -3
        tipoMovimiento: TipoMovimientoInventario.AJUSTE,
      }),
    );
  });

  it('cancelar usa AJUSTE y no DEVOLUCION: nada volvio fisicamente', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    const params = inventario.ajustarStock.mock.calls[0][0] as { tipoMovimiento: string; motivo: string };
    expect(params.tipoMovimiento).not.toBe(TipoMovimientoInventario.DEVOLUCION);
    expect(params.motivo).toContain('vencida');
  });

  it('cancelar devuelve tambien el uso del cupon', async () => {
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, cuponId: 'cup1' });
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(promociones.liberarCupon).toHaveBeenCalledWith('cup1', expect.anything());
  });

  it('una venta sin cupon no llama a liberarCupon', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(promociones.liberarCupon).not.toHaveBeenCalled();
  });

  it('cancelar lee la venta CON BLOQUEO: si no, dos barridas devuelven el stock dos veces', async () => {
    // El estado recien se escribe al final, asi que sin `FOR UPDATE` dos
    // transacciones concurrentes leen las dos PENDIENTE y las dos suman el
    // stock. La prueba que lo demuestra de verdad, contra Postgres y con dos
    // llamadas simultaneas, esta en test/pagos.e2e-spec.ts; esta fija el
    // contrato para que nadie borre la opcion sin darse cuenta.
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(ventaRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });

  it('cancelar deja la venta en CANCELADA', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(ventaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoVenta.CANCELADA }),
    );
  });
});
