import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TENANT_PRUEBA } from '../../../../vitest.setup.js';
import { DataSource } from 'typeorm';
import { VentasService } from './ventas.service.js';
import { CarritosService, sumarAlCarrito } from './carritos.service.js';
import { EstadoVenta, Venta } from '../entities/venta.entity.js';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';

describe('orden de bloqueo y precio de la venta sin conexion', () => {
  function servicio(precioActual: number, anterior: { cents: number; cambiadoEn: Date } | null = null) {
    const ajustarStock = vi.fn();
    const ventaRepo = { create: vi.fn((x) => x), save: vi.fn(async (x) => ({ ...x, createdAt: new Date() })) };
    const itemRepo = { create: vi.fn((x) => x), save: vi.fn(async (x) => x) };
    const manager = { getRepository: (e: unknown) => (String(e).includes('VentaItem') ? itemRepo : ventaRepo) };
    const productos = {
      findVarianteById: vi.fn(async (id: string) => ({
        id, activo: true,
        producto: {
          activo: true, precioCents: precioActual, titulo: id,
          precioAnteriorCents: anterior?.cents ?? null, precioCambiadoEn: anterior?.cambiadoEn ?? null,
        },
      })),
    };
    const service = new VentasService(
      {} as never, {} as never, { transaction: (cb: (m: unknown) => unknown) => cb(manager) } as never,
      { assertExists: vi.fn() } as never, productos as never, { ajustarStock } as never, {} as never, {} as never, {} as never,
    );
    return { service, ajustarStock, itemRepo };
  }

  it('descuenta el stock siempre en el mismo orden: dos pedidos cruzados no se bloquean entre si', async () => {
    const { service, ajustarStock } = servicio(100);
    await service.registrarPresencial({ sucursalId: 's1', items: [{ varianteId: 'b', cantidad: 1 }, { varianteId: 'a', cantidad: 1 }] } as never, 'c1');
    expect(ajustarStock.mock.calls.map(([p]) => p.varianteId)).toEqual(['a', 'b']);
  });

  it('una venta sin conexion queda con el precio que regia cuando se cobro', async () => {
    const vendidaEn = new Date(Date.now() - 60 * 60_000);
    const { service, itemRepo } = servicio(25000, { cents: 10000, cambiadoEn: new Date(Date.now() - 10 * 60_000) });
    await service.registrarPresencial({
      sucursalId: 's1', vendidaEn: vendidaEn.toISOString(),
      items: [{ varianteId: 'a', cantidad: 1, precioUnitCents: 10000 }],
    } as never, 'c1');
    expect(itemRepo.create.mock.calls[0][0].precioUnitCents).toBe(10000);
  });

  it('el cajero no puede poner un precio que la prenda nunca tuvo', async () => {
    const { service } = servicio(50000);
    await expect(service.registrarPresencial({
      sucursalId: 's1', vendidaEn: new Date().toISOString(),
      items: [{ varianteId: 'a', cantidad: 1, precioUnitCents: 1 }],
    } as never, 'c1')).rejects.toThrow(/precio/i);
  });

  it('una fecha de venta futura o de hace mas de 7 dias se rechaza', async () => {
    const { service } = servicio(100);
    for (const f of [new Date(Date.now() + 3600_000), new Date(Date.now() - 8 * 86400_000)]) {
      await expect(service.registrarPresencial({
        sucursalId: 's1', vendidaEn: f.toISOString(), items: [{ varianteId: 'a', cantidad: 1, precioUnitCents: 100 }],
      } as never, 'c1')).rejects.toThrow();
    }
  });

  it('con conexion manda el precio actual aunque el cliente mande otro', async () => {
    const { service, itemRepo } = servicio(25000);
    await service.registrarPresencial({ sucursalId: 's1', items: [{ varianteId: 'a', cantidad: 1, precioUnitCents: 1 }] } as never, 'c1');
    expect(itemRepo.create.mock.calls[0][0].precioUnitCents).toBe(25000);
  });
});

describe('ventas con clave de idempotencia', () => {
  it('reintentar tras una caida devuelve la venta ya guardada, no crea otra', async () => {
    const venta = { id: 'v1', estado: 'PAGADA', createdAt: new Date() };
    const ventaRepository = { findOne: vi.fn().mockResolvedValue(venta) };
    const ventaItemRepository = { find: vi.fn().mockResolvedValue([]) };
    const transaction = vi.fn();
    const service = new VentasService(
      ventaRepository as never, ventaItemRepository as never, { transaction } as never,
      { assertExists: vi.fn() } as never, {} as never, {} as never, {} as never, {} as never, {} as never,
    );

    const r = await service.registrarPresencial({ sucursalId: 's1', items: [] } as never, 'c1', 'clave-1');

    expect(r.id).toBe('v1');
    expect(transaction).not.toHaveBeenCalled();
    expect(ventaRepository.findOne.mock.calls[0][0].where).toMatchObject({ claveIdempotencia: 'clave-1' });
  });

  it('una compra hecha sin conexion trae sus prendas: no depende del carrito del servidor', async () => {
    const registrar = vi.fn().mockResolvedValue({ id: 'v3' });
    const ventaRepo = { count: vi.fn().mockResolvedValue(0), findOne: vi.fn().mockResolvedValue(null) };
    const service = new VentasService(
      { findOne: vi.fn().mockResolvedValue(null) } as never, {} as never,
      { transaction: (cb: (m: unknown) => unknown) => cb({ getRepository: () => ventaRepo }) } as never,
      { assertExists: vi.fn() } as never, {} as never, {} as never, { vaciar: vi.fn() } as never, {} as never, {} as never,
    );
    (service as unknown as { registrarVenta: typeof registrar }).registrarVenta = registrar;

    await service.checkoutCarrito('u1', { sucursalId: 's1', canal: 'MOVIL', items: [{ varianteId: 'v', cantidad: 1 }] } as never, 'k');

    expect(registrar.mock.calls[0][0].items).toEqual([{ varianteId: 'v', cantidad: 1 }]);
  });

  it('lo mismo en el checkout: no responde carrito vacio', async () => {
    const ventaRepository = { findOne: vi.fn().mockResolvedValue({ id: 'v2', createdAt: new Date() }) };
    const transaction = vi.fn();
    const service = new VentasService(
      ventaRepository as never, { find: vi.fn().mockResolvedValue([]) } as never, { transaction } as never,
      { assertExists: vi.fn() } as never, {} as never, {} as never, {} as never, {} as never, {} as never,
    );

    const r = await service.checkoutCarrito('u1', { sucursalId: 's1' } as never, 'clave-2');

    expect(r.id).toBe('v2');
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('VentasService — cobro y cancelacion', () => {
  let ventaRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let itemRepo: { find: ReturnType<typeof vi.fn> };
  let inventario: { ajustarStock: ReturnType<typeof vi.fn> };
  let promociones: { liberarCupon: ReturnType<typeof vi.fn> };
  let carritos: { devolverItems: ReturnType<typeof vi.fn> };
  let service: VentasService;

  const VENTA_BASE = {
    id: 'v1', sucursalId: 's1', clienteId: 'c1', cuponId: null,
    estado: EstadoVenta.PENDIENTE,
  } as Venta;

  beforeEach(() => {
    ventaRepo = {
      findOne: vi.fn().mockResolvedValue({ ...VENTA_BASE }),
      save: vi.fn((e) => e),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    itemRepo = { find: vi.fn().mockResolvedValue([{ varianteId: 'var1', cantidad: 3 }]) };
    inventario = { ajustarStock: vi.fn() };
    promociones = { liberarCupon: vi.fn() };
    carritos = { devolverItems: vi.fn() };

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
      carritos as never, // carritosService
      {} as never, // reservasService
      promociones as never, // promocionesService
    );
  });

  it('marcarPagada lleva una venta PENDIENTE a PAGADA con un UPDATE condicionado a PENDIENTE', async () => {
    await service.marcarPagada('v1');
    expect(ventaRepo.update).toHaveBeenCalledWith(
      { id: 'v1', estado: EstadoVenta.PENDIENTE, tenantId: TENANT_PRUEBA },
      expect.objectContaining({ estado: EstadoVenta.PAGADA }),
    );
    expect(ventaRepo.save).not.toHaveBeenCalled();
  });

  it('marcarPagada escribe el numeroComprobante derivado del id', async () => {
    await service.marcarPagada('abcdef12-3456');
    expect(ventaRepo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ numeroComprobante: 'C-ABCDEF12' }),
    );
  });

  it('marcarPagada es idempotente: una venta ya PAGADA no se toca ni falla', async () => {
    ventaRepo.update.mockResolvedValue({ affected: 0 });
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, estado: EstadoVenta.PAGADA });
    await expect(service.marcarPagada('v1')).resolves.toBeUndefined();
    expect(ventaRepo.save).not.toHaveBeenCalled();
  });

  it('marcarPagada sobre una venta CANCELADA es un error de negocio (no la pisa)', async () => {
    ventaRepo.update.mockResolvedValue({ affected: 0 });
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, estado: EstadoVenta.CANCELADA });
    await expect(service.marcarPagada('v1')).rejects.toThrow(OperacionInvalidaException);
    expect(ventaRepo.save).not.toHaveBeenCalled();
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

  it('cancelar devuelve las prendas al carrito de la clienta (el checkout lo habia vaciado)', async () => {
    await service.cancelarPorPagoNoCompletado('v1', 'vencida');
    expect(carritos.devolverItems).toHaveBeenCalledWith(
      'c1',
      [{ varianteId: 'var1', cantidad: 3 }],
      expect.anything(),
    );
  });

  it('una venta que no esta PENDIENTE no se cancela ni toca el carrito', async () => {
    ventaRepo.findOne.mockResolvedValue({ ...VENTA_BASE, estado: EstadoVenta.PAGADA });
    await expect(service.cancelarPorPagoNoCompletado('v1', 'x')).rejects.toThrow(
      OperacionInvalidaException,
    );
    expect(carritos.devolverItems).not.toHaveBeenCalled();
    expect(inventario.ajustarStock).not.toHaveBeenCalled();
  });
});

describe('CarritosService — devolver prendas de una compra no pagada', () => {
  it('sumarAlCarrito suma a lo que ya hay sin pasar el tope de 3 por variante', () => {
    expect(
      sumarAlCarrito(
        [{ varianteId: 'a', cantidad: 2 }],
        [{ varianteId: 'a', cantidad: 2 }, { varianteId: 'b', cantidad: 1 }],
      ),
    ).toEqual([{ varianteId: 'a', cantidad: 3 }, { varianteId: 'b', cantidad: 1 }]);
  });

  it('devolverItems saltea variantes o productos dados de baja y crea el carrito si no existe', async () => {
    const productos = {
      findVarianteById: vi.fn((id: string) =>
        id === 'baja'
          ? Promise.resolve({ activo: false, producto: { activo: true } })
          : id === 'borrada'
            ? Promise.reject(new Error('no existe'))
            : Promise.resolve({ activo: true, producto: { activo: true } }),
      ),
    };
    const repo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((e) => e),
      save: vi.fn((e) => e),
    };
    const carritosService = new CarritosService({} as never, productos as never);
    await carritosService.devolverItems(
      'c1',
      [
        { varianteId: 'ok', cantidad: 2 },
        { varianteId: 'baja', cantidad: 1 },
        { varianteId: 'borrada', cantidad: 1 },
      ],
      { getRepository: () => repo } as never,
    );
    expect(repo.save).toHaveBeenCalledWith({
      usuarioId: 'c1',
      items: [{ varianteId: 'ok', cantidad: 2 }],
    });
  });

  it('agregar al carrito una prenda dada de baja es 409 y no toca el carrito', async () => {
    const productos = {
      findVarianteById: vi.fn().mockResolvedValue({ activo: true, producto: { activo: false } }),
    };
    const repo = { manager: { transaction: vi.fn() } };
    const carritosService = new CarritosService(repo as never, productos as never);
    await expect(
      carritosService.addItem('c1', { varianteId: 'v', cantidad: 1 } as never),
    ).rejects.toThrow(OperacionInvalidaException);
    expect(repo.manager.transaction).not.toHaveBeenCalled();
  });
});
