import { describe, expect, it } from 'vitest';
import { armarCuponDto, cuponSchema, estadoCupon, textoUsos, valoresIniciales, type CuponFormValues } from './cupones';
import { esErrorDeLimite, iniciales } from './comunes';
import type { Cupon } from '../types/cupones.types';

const base: CuponFormValues = {
  codigo: 'verano20',
  tipoDescuento: 'PORCENTAJE',
  valor: '20',
  fechaInicio: '2026-11-01',
  fechaFin: '2026-11-30',
  usosMaximos: '',
  montoMinimo: '',
};

function errores(v: Partial<CuponFormValues>) {
  const r = cuponSchema.safeParse({ ...base, ...v });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
}

describe('cuponSchema', () => {
  it('acepta un cupón válido', () => expect(errores({})).toEqual({}));
  it('pide código', () => expect(errores({ codigo: '  ' }).codigo).toBe('El código del cupón es obligatorio'));
  it('valor mayor a 0', () => expect(errores({ valor: '0' }).valor).toMatch(/mayor a 0/));
  it('porcentaje hasta 100', () => expect(errores({ valor: '120' }).valor).toMatch(/100%/));
  it('porcentaje entero', () => expect(errores({ valor: '12.5' }).valor).toMatch(/entero/));
  it('monto fijo admite decimales', () => expect(errores({ tipoDescuento: 'MONTO_FIJO', valor: '12,5' })).toEqual({}));
  it('fin no antes que inicio', () => expect(errores({ fechaFin: '2026-10-01' }).fechaFin).toMatch(/anterior/));
  it('formato de fecha', () => expect(errores({ fechaInicio: '1/11/2026' }).fechaInicio).toMatch(/AAAA-MM-DD/));
  it('usos enteros positivos', () => expect(errores({ usosMaximos: '0' }).usosMaximos).toBeTruthy());
  it('monto mínimo no negativo', () => expect(errores({ montoMinimo: '-5' }).montoMinimo).toBeTruthy());
});

describe('armarCuponDto', () => {
  it('porcentaje: valor tal cual, código en mayúsculas, sin límites', () => {
    expect(armarCuponDto(base)).toEqual({
      codigo: 'VERANO20',
      tipoDescuento: 'PORCENTAJE',
      valor: 20,
      fechaInicio: '2026-11-01T00:00:00.000Z',
      fechaFin: '2026-11-30T23:59:59.000Z',
      usosMaximos: null,
      montoMinimoCents: null,
      activo: true,
    });
  });
  it('monto fijo y mínimo en centavos', () => {
    const dto = armarCuponDto({ ...base, tipoDescuento: 'MONTO_FIJO', valor: '50,5', usosMaximos: '10', montoMinimo: '150' });
    expect(dto).toMatchObject({ valor: 5050, usosMaximos: 10, montoMinimoCents: 15000 });
  });
});

describe('valoresIniciales', () => {
  it('vigencia de un mes', () => {
    const v = valoresIniciales(new Date('2026-11-08T12:00:00Z'));
    expect([v.fechaInicio, v.fechaFin]).toEqual(['2026-11-08', '2026-12-08']);
  });
});

describe('estadoCupon', () => {
  const c: Cupon = {
    id: '1', codigo: 'X', tipoDescuento: 'PORCENTAJE', valor: 10,
    fechaInicio: '2026-11-01T00:00:00.000Z', fechaFin: '2026-11-30T23:59:59.000Z',
    usosMaximos: 5, usosActuales: 1, montoMinimoCents: null, activo: true, createdAt: '', updatedAt: '',
  };
  const hoy = new Date('2026-11-08T00:00:00Z');
  it('activo', () => expect(estadoCupon(c, hoy)).toBe('ACTIVO'));
  it('inactivo gana a todo', () => expect(estadoCupon({ ...c, activo: false, usosActuales: 9 }, new Date('2027-01-01'))).toBe('INACTIVO'));
  it('expirado', () => expect(estadoCupon(c, new Date('2026-12-01'))).toBe('EXPIRADO'));
  it('agotado', () => expect(estadoCupon({ ...c, usosActuales: 5 }, hoy)).toBe('AGOTADO'));
  it('usos sin límite', () => expect(textoUsos({ usosActuales: 3, usosMaximos: null })).toBe('3 / ∞'));
});

describe('comunes', () => {
  it('detecta el 409 del plan', () => {
    expect(esErrorDeLimite('Tu plan Básico permite hasta 1 sucursal')).toBe(true);
    expect(esErrorDeLimite('Ya existe un cupón con ese código')).toBe(false);
    expect(esErrorDeLimite(null)).toBe(false);
  });
  it('iniciales', () => {
    expect(iniciales('Rosa Mamani Quispe')).toBe('RQ');
    expect(iniciales('rosa')).toBe('RO');
  });
});
