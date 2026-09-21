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

  it('DEJA PASAR null en las propiedades opcionales: @IsOptional ignora null', () => {
    // No es hipotetico: la salida estructurada de Gemini emite `null` de rutina
    // para las propiedades opcionales que decidio no llenar. `@IsOptional()` de
    // class-validator salta la validacion ante `null` igual que ante `undefined`,
    // asi que este payload es VALIDO y llega entero al motor. Por eso el motor
    // saltea con `valor == null` y le pone un tope duro al limite: esta prueba
    // documenta de donde viene esa necesidad.
    const errores = validar({
      metrica: 'ingresos',
      agruparPor: 'ninguno',
      filtros: { sucursalId: null, desde: null },
      limite: null,
      compararCon: null,
    });
    expect(errores).toHaveLength(0);

    const ficha = plainToInstance(FichaConsultaDto, {
      metrica: 'ingresos', agruparPor: 'ninguno', limite: null,
    });
    expect(ficha.limite).toBeNull();
  });

  it('aplica los valores por defecto de orden y limite', () => {
    const ficha = plainToInstance(FichaConsultaDto, { metrica: 'ingresos', agruparPor: 'ninguno' });
    expect(ficha.orden).toBe('desc');
    expect(ficha.limite).toBe(20);
  });
});
