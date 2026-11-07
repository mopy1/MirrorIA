import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { DataSource, Repository } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { correrConContexto } from '../../../core/tenancy/tenant-context.js';
import type { VentasService } from '../../ventas/service/ventas.service.js';
import type { Pago } from '../entities/pago.entity.js';
import type { ExpiracionService } from './expiracion.service.js';
import { PagosService } from './pagos.service.js';
import type { Pasarela } from './pasarela/pasarela.interface.js';
import type { RegistroPasarelasService } from './pasarela/registro-pasarelas.service.js';

const CLIENTA = { sub: 'cli1', role: 'CUSTOMER', tenantId: 't1', email: 'a@b.c', sucursalId: null } as unknown as JwtPayload;
const enTienda = <T>(fn: () => Promise<T>) => correrConContexto({ tenantId: '11111111-1111-4111-a111-111111111111' } as never, fn);

function armar(pendiente: Partial<Pago> | null = null) {
  const repo = {
    create: vi.fn((e) => e),
    save: vi.fn(async (e) => e),
    findOne: vi.fn().mockResolvedValue(pendiente),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = { getRepository: () => repo, query: vi.fn().mockResolvedValue([{ estado: 'PENDIENTE' }]) };
  const ventas = {
    findOne: vi.fn().mockResolvedValue({ id: 'v1', clienteId: 'cli1', estado: 'PENDIENTE', totalCents: 69600, numeroComprobante: null }),
    marcarPagada: vi.fn(),
  };
  const paypal = {
    metadata: { tipo: 'BILLETERA' },
    iniciarCobro: vi.fn().mockResolvedValue({ modo: 'REDIRECT', url: 'https://paypal/aprobar', token: 'ORDEN-1' }),
    confirmarCobro: vi.fn(),
  };
  const registro = { asegurarDisponible: vi.fn(() => paypal), obtener: vi.fn(() => paypal) };
  const service = new PagosService(
    repo as unknown as Repository<Pago>,
    { transaction: (cb: (m: unknown) => unknown) => cb(manager) } as unknown as DataSource,
    ventas as unknown as VentasService,
    { get: vi.fn(() => 'http://localhost:5174/pago/exito') } as unknown as ConfigService,
    { expirarVencidas: vi.fn(), vencimientoTarjeta: vi.fn() } as unknown as ExpiracionService,
    {} as Pasarela,
    undefined,
    registro as unknown as RegistroPasarelasService,
  );
  return { service, repo, paypal, ventas };
}

describe('PayPal en las compras de la tienda', () => {
  it('crea la orden por el total de la venta y guarda el pago pendiente', async () => {
    const { service, repo, paypal } = armar();
    const r = await enTienda(() => service.iniciarPaypal('v1', CLIENTA));
    expect(r).toEqual({ url: 'https://paypal/aprobar' });
    expect(paypal.iniciarCobro.mock.calls[0][0]).toMatchObject({ montoCents: 69600, contexto: 'checkout' });
    expect(repo.save.mock.calls[0][0]).toMatchObject({ proveedorPago: 'PAYPAL', metodo: 'BILLETERA', referenciaExterna: 'ORDEN-1', estado: 'PENDIENTE' });
  });

  it('un segundo clic reusa el mismo pago: PayPal devuelve la misma orden', async () => {
    const { service, repo, paypal } = armar({ id: 'pago-1', proveedorPago: 'PAYPAL' as never, referenciaExterna: 'ORDEN-1' });
    await enTienda(() => service.iniciarPaypal('v1', CLIENTA));
    expect(paypal.iniciarCobro.mock.calls[0][0].referencia).toBe('pago-1');
    expect(repo.save.mock.calls[0][0].id).toBe('pago-1');
  });

  it('al volver, la captura de PayPal acredita la venta', async () => {
    const { service, paypal, ventas } = armar({ id: 'pago-1', ventaId: 'v1', estado: 'PENDIENTE' as never, proveedorPago: 'PAYPAL' as never, referenciaExterna: 'ORDEN-1' });
    paypal.confirmarCobro.mockResolvedValue({ estado: 'APROBADO', transaccion: 'CAP-1', montoCents: 10000 });
    await enTienda(() => service.confirmarTarjeta('v1', CLIENTA));
    expect(paypal.confirmarCobro).toHaveBeenCalledWith('ORDEN-1');
    expect(ventas.marcarPagada).toHaveBeenCalled();
  });

  it('volver sin aprobar no acredita nada', async () => {
    const { service, paypal, ventas } = armar({ id: 'pago-1', ventaId: 'v1', estado: 'PENDIENTE' as never, proveedorPago: 'PAYPAL' as never, referenciaExterna: 'ORDEN-1' });
    paypal.confirmarCobro.mockResolvedValue({ estado: 'PENDIENTE' });
    await enTienda(() => service.confirmarTarjeta('v1', CLIENTA));
    expect(ventas.marcarPagada).not.toHaveBeenCalled();
  });

  it('nadie inicia PayPal sobre la compra de otra persona', async () => {
    const { service } = armar();
    await expect(enTienda(() => service.iniciarPaypal('v1', { ...CLIENTA, sub: 'otra' } as JwtPayload))).rejects.toThrow();
  });
});
