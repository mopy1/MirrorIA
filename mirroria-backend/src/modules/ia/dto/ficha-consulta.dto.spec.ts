import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FichaConsultaDto } from './ficha-consulta.dto.js';

function validar(payload: unknown) {
  return validateSync(plainToInstance(FichaConsultaDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('FichaConsultaDto', () => {
  it('acepta una ficha minima valida', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'sucursal' })).toHaveLength(0);
  });

  it('rechaza una metrica inexistente', () => {
    expect(validar({ metrica: 'ingresos_falsos', agruparPor: 'sucursal' }).length).toBeGreaterThan(0);
  });

  it('rechaza limite fuera de rango', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', limite: 500 }).length).toBeGreaterThan(0);
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', limite: 0 }).length).toBeGreaterThan(0);
  });

  it('rechaza un uuid mal formado en los filtros', () => {
    expect(
      validar({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: 'no-soy-uuid' } }).length,
    ).toBeGreaterThan(0);
  });

  it('rechaza propiedades desconocidas: la ficha es cerrada', () => {
    expect(validar({ metrica: 'ingresos', agruparPor: 'ninguno', sqlCrudo: 'DROP TABLE ventas' }).length)
      .toBeGreaterThan(0);
  });

  it('aplica los valores por defecto de orden y limite', () => {
    const ficha = plainToInstance(FichaConsultaDto, { metrica: 'ingresos', agruparPor: 'ninguno' });
    expect(ficha.orden).toBe('desc');
    expect(ficha.limite).toBe(20);
  });
});
