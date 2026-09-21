import { describe, expect, it } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { EstadoPago, MetodoPago, Pago, ProveedorPago } from './pago.entity.js';

describe('Pago', () => {
  it('mapea a la tabla pagos', () => {
    const tabla = getMetadataArgsStorage().tables.find((t) => t.target === Pago);
    expect(tabla?.name).toBe('pagos');
  });

  it('declara las columnas del diseno', () => {
    const columnas = getMetadataArgsStorage()
      .columns.filter((c) => c.target === Pago)
      .map((c) => c.options.name);
    expect(columnas).toEqual(
      expect.arrayContaining([
        'venta_id', 'proveedor_pago', 'metodo', 'monto_cents', 'estado',
        'monto_reembolsado_cents', 'motivo_reembolso', 'reembolsado_at',
        'event_id', 'referencia_externa',
      ]),
    );
  });

  it('event_id es unico: ahi vive la idempotencia de los webhooks', () => {
    const eventId = getMetadataArgsStorage()
      .columns.find((c) => c.target === Pago && c.options.name === 'event_id');
    expect(eventId?.options.unique).toBe(true);
    expect(eventId?.options.nullable).not.toBe(true);
  });

  it('los tres metodos y los dos proveedores del diseno', () => {
    expect(Object.values(MetodoPago)).toEqual(['TARJETA', 'QR', 'EFECTIVO']);
    expect(Object.values(ProveedorPago)).toEqual(['STRIPE', 'MANUAL']);
    expect(Object.values(EstadoPago)).toEqual(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO']);
  });
});
