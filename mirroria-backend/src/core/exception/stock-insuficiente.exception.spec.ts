import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import {
  StockInsuficienteException,
  type DetallesStockInsuficiente,
} from './stock-insuficiente.exception.js';

function capturarError(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  new GlobalExceptionFilter().catch(exception, host);
  return json.mock.calls[0][0] as {
    status: number;
    codigo: string;
    message: string;
    detalles: DetallesStockInsuficiente;
    timestamp: string;
  };
}

describe('StockInsuficienteException (conflicto stock = 1)', () => {
  it('instancia la excepción con status 409 y codigo STOCK_AGOTADO_CONFLICTO', () => {
    const err = new StockInsuficienteException('var-seda-m', 'suc-central', 0, 1);
    expect(err.getStatus()).toBe(409);
    expect(err.codigo).toBe('STOCK_AGOTADO_CONFLICTO');
    expect(err.detalles).toEqual({
      varianteId: 'var-seda-m',
      sucursalId: 'suc-central',
      disponible: 0,
      solicitado: 1,
    });
  });

  it('GlobalExceptionFilter serializa el error con status 409, codigo, message y detalles', () => {
    const err = new StockInsuficienteException('var-seda-m', 'suc-central', 0, 1, {
      prendaNombre: 'Vestido Gala Seda Rosa',
      talla: 'M',
      color: 'Rosa',
      sucursalNombre: 'Sucursal Central',
      alternativas: {
        otrasSucursales: [{ sucursalId: 'suc-equipetrol', disponible: 3 }],
        otrasTallas: [{ varianteId: 'var-seda-s', talla: 'S', disponible: 2 }],
      },
    });

    const res = capturarError(err);
    expect(res.status).toBe(409);
    expect(res.codigo).toBe('STOCK_AGOTADO_CONFLICTO');
    expect(res.message).toContain('Stock insuficiente para la variante var-seda-m');
    expect(res.detalles.varianteId).toBe('var-seda-m');
    expect(res.detalles.prendaNombre).toBe('Vestido Gala Seda Rosa');
    expect(res.detalles.alternativas?.otrasSucursales?.[0].sucursalId).toBe('suc-equipetrol');
    expect(res.detalles.alternativas?.otrasSucursales?.[0].disponible).toBe(3);
    expect(res.timestamp).toBeDefined();
  });
});
