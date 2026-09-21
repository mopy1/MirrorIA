import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ExpiracionService } from './expiracion.service.js';
import { EstadoPago, MetodoPago, Pago } from '../entities/pago.entity.js';
import type { VentasService } from '../../ventas/service/ventas.service.js';

const AHORA = new Date('2026-09-21T12:00:00Z');

describe('ExpiracionService', () => {
  let pagoRepo: Record<string, ReturnType<typeof vi.fn>>;
  let ventas: { cancelarPorPagoNoCompletado: ReturnType<typeof vi.fn> };
  let service: ExpiracionService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
    pagoRepo = { find: vi.fn().mockResolvedValue([]), save: vi.fn((e) => e) };
    ventas = { cancelarPorPagoNoCompletado: vi.fn() };
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    service = new ExpiracionService(
      pagoRepo as unknown as Repository<Pago>,
      ventas as unknown as VentasService,
      config,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function pagoDeHace(minutos: number, metodo: MetodoPago): Pago {
    return {
      id: `p-${minutos}`, ventaId: `v-${minutos}`, metodo,
      estado: EstadoPago.PENDIENTE,
      createdAt: new Date(AHORA.getTime() - minutos * 60_000),
    } as Pago;
  }

  it('una tarjeta de hace 10 minutos NO vence: el plazo es de 30', async () => {
    pagoRepo.find.mockResolvedValue([pagoDeHace(10, MetodoPago.TARJETA)]);
    const cuantas = await service.expirarVencidas();
    expect(cuantas).toBe(0);
    expect(ventas.cancelarPorPagoNoCompletado).not.toHaveBeenCalled();
  });

  it('una tarjeta de hace 45 minutos vence y devuelve su stock', async () => {
    pagoRepo.find.mockResolvedValue([pagoDeHace(45, MetodoPago.TARJETA)]);
    const cuantas = await service.expirarVencidas();
    expect(cuantas).toBe(1);
    expect(ventas.cancelarPorPagoNoCompletado).toHaveBeenCalledWith(
      'v-45', expect.stringContaining('vencido'),
    );
  });

  it('un cobro en efectivo de hace 45 minutos NO vence: su plazo es de un dia', async () => {
    pagoRepo.find.mockResolvedValue([pagoDeHace(45, MetodoPago.EFECTIVO)]);
    expect(await service.expirarVencidas()).toBe(0);
  });

  it('un cobro por QR de hace dos dias si vence', async () => {
    pagoRepo.find.mockResolvedValue([pagoDeHace(2880, MetodoPago.QR)]);
    expect(await service.expirarVencidas()).toBe(1);
  });

  it('el pago vencido queda RECHAZADO, no se borra', async () => {
    pagoRepo.find.mockResolvedValue([pagoDeHace(45, MetodoPago.TARJETA)]);
    await service.expirarVencidas();
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoPago.RECHAZADO }),
    );
  });

  it('si cancelar una venta falla, sigue con las demas', async () => {
    // Una venta rota no puede impedir que el resto libere su stock.
    ventas.cancelarPorPagoNoCompletado
      .mockRejectedValueOnce(new Error('esa venta ya estaba cancelada'))
      .mockResolvedValueOnce(undefined);
    pagoRepo.find.mockResolvedValue([
      pagoDeHace(45, MetodoPago.TARJETA),
      pagoDeHace(60, MetodoPago.TARJETA),
    ]);
    expect(await service.expirarVencidas()).toBe(1);
    expect(ventas.cancelarPorPagoNoCompletado).toHaveBeenCalledTimes(2);
  });
});
