import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { centavosBobAUsd, tipoCambioBobUsd } from './moneda.js';

const configCon = (valor?: string) => ({ get: vi.fn(() => valor) }) as unknown as ConfigService;

describe('conversion de bolivianos a dolares', () => {
  it('Bs 696,00 son USD 100,00 al tipo de cambio oficial', () => {
    expect(centavosBobAUsd(69600, 6.96)).toBe(10000);
  });

  it('redondea al centavo', () => {
    expect(centavosBobAUsd(9900, 6.96)).toBe(1422);
  });

  it('usa el tipo de cambio configurado', () => {
    expect(tipoCambioBobUsd(configCon('10'))).toBe(10);
  });

  it('sin configurar, o con un valor invalido, cae en el oficial', () => {
    expect(tipoCambioBobUsd(configCon(undefined))).toBe(6.96);
    expect(tipoCambioBobUsd(configCon('abc'))).toBe(6.96);
    expect(tipoCambioBobUsd(configCon('0'))).toBe(6.96);
  });
});
