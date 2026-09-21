import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PagosService } from './pagos.service.js';
import { EstadoPago, MetodoPago, Pago, ProveedorPago } from '../entities/pago.entity.js';
import { VentaNoPagableException } from '../exception/venta-no-pagable.exception.js';
import type { VentasService } from '../../ventas/service/ventas.service.js';
import type { ExpiracionService } from './expiracion.service.js';

const DUENO = { sub: 'cli1', email: 'a@a.com', role: 'CUSTOMER', sucursalId: null };
const CAJERO = { sub: 'caj1', email: 'b@b.com', role: 'CAJERO', sucursalId: 's1' };

describe('PagosService — cobro manual', () => {
  let pagoRepo: Record<string, ReturnType<typeof vi.fn>>;
  let ventas: { findOne: ReturnType<typeof vi.fn>; marcarPagada: ReturnType<typeof vi.fn> };
  let service: PagosService;

  beforeEach(() => {
    pagoRepo = {
      create: vi.fn((e) => e),
      save: vi.fn((e) => Promise.resolve({ id: 'p1', ...e })),
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    };
    ventas = {
      findOne: vi.fn().mockResolvedValue({
        id: 'v1', clienteId: 'cli1', estado: 'PENDIENTE', totalCents: 25000,
      }),
      marcarPagada: vi.fn(),
    };
    const config = { get: vi.fn().mockReturnValue('https://ejemplo/qr.png') } as unknown as ConfigService;
    // La confirmacion corre dentro de una transaccion: el manager que le llega
    // al callback expone el mismo repo de pagos que usamos afuera, para que
    // las aserciones sobre pagoRepo.save sigan valiendo.
    const manager = { getRepository: () => pagoRepo };
    const dataSource = {
      transaction: (cb: (m: unknown) => unknown) => cb(manager),
    } as unknown as DataSource;
    const expiracion = { expirarVencidas: vi.fn().mockResolvedValue(0) };
    service = new PagosService(
      pagoRepo as unknown as Repository<Pago>,
      dataSource,
      ventas as unknown as VentasService,
      config,
      expiracion as unknown as ExpiracionService,
    );
  });

  it('iniciar un cobro por QR crea un pago PENDIENTE por el total de la venta', async () => {
    const res = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ventaId: 'v1',
        montoCents: 25000,
        metodo: MetodoPago.QR,
        proveedorPago: ProveedorPago.MANUAL,
        estado: EstadoPago.PENDIENTE,
      }),
    );
    expect(res.montoCents).toBe(25000);
  });

  it('el pago manual lleva un event_id propio, que es donde vive la unicidad', async () => {
    await service.iniciarManual('v1', { metodo: MetodoPago.EFECTIVO }, DUENO);
    const guardado = pagoRepo.save.mock.calls[0][0] as { eventId: string };
    expect(guardado.eventId).toMatch(/^manual:/);
  });

  it('por QR devuelve la imagen configurada; por efectivo no', async () => {
    const qr = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    expect(qr.qrUrl).toBe('https://ejemplo/qr.png');

    const efectivo = await service.iniciarManual('v1', { metodo: MetodoPago.EFECTIVO }, DUENO);
    expect(efectivo.qrUrl).toBeNull();
  });

  it('nadie puede iniciar el pago de una venta ajena', async () => {
    ventas.findOne.mockResolvedValue({ id: 'v1', clienteId: 'OTRO', estado: 'PENDIENTE', totalCents: 100 });
    await expect(
      service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO),
    ).rejects.toThrow();
    expect(pagoRepo.save).not.toHaveBeenCalled();
  });

  it('una venta que no esta PENDIENTE no se puede pagar', async () => {
    ventas.findOne.mockResolvedValue({ id: 'v1', clienteId: 'cli1', estado: 'CANCELADA', totalCents: 100 });
    await expect(
      service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO),
    ).rejects.toThrow(VentaNoPagableException);
  });

  it('confirmar aprueba el pago y cobra la venta', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    // El segundo argumento es el EntityManager de la transaccion (ver
    // "si la venta ya no se puede cobrar..." mas abajo): mismo manager con el
    // que se guardo el pago, para que las dos escrituras vivan o mueran juntas.
    expect(ventas.marcarPagada).toHaveBeenCalledWith('v1', expect.anything());
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoPago.APROBADO }),
    );
  });

  it('confirmar deja registro de QUIEN confirmo', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    const guardado = pagoRepo.save.mock.calls[0][0] as { referenciaExterna: string };
    expect(guardado.referenciaExterna).toContain('caj1');
  });

  it('confirmar dos veces el mismo pago no cobra dos veces', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.APROBADO, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    expect(ventas.marcarPagada).not.toHaveBeenCalled();
  });

  it('un pago de tarjeta NO se puede confirmar a mano: lo decide el webhook', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA,
    });
    await expect(service.confirmarManual('p1', CAJERO)).rejects.toThrow();
    expect(ventas.marcarPagada).not.toHaveBeenCalled();
  });

  it('si la venta ya no se puede cobrar, el pago NO queda aprobado', async () => {
    // Pasa de verdad: la expiracion cancela una venta vencida mientras el cajero
    // tiene la pantalla abierta. Un cobro aprobado sobre una venta cancelada
    // cuyo stock ya volvio seria plata que el sistema dice haber recibido.
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    ventas.marcarPagada.mockRejectedValue(new Error('la venta esta CANCELADA'));

    await expect(service.confirmarManual('p1', CAJERO)).rejects.toThrow();
  });

  it('dos cobros manuales generan event_id distintos', async () => {
    await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    const [primero, segundo] = pagoRepo.save.mock.calls.map((c) => (c[0] as { eventId: string }).eventId);
    expect(primero).not.toBe(segundo);
  });
});
