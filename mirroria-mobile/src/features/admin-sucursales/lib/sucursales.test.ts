import { describe, expect, it } from 'vitest';
import { armarSucursalDto, ciudadesOrdenadas, sucursalSchema, sucursalesPorCiudad } from './sucursales';
import type { Sucursal } from '../types/sucursales-admin.types';

describe('sucursalSchema', () => {
  const ok = { ciudadId: 'c1', nombre: 'Centro', direccion: 'Av. Arce 123', telefono: '' };
  it('acepta datos válidos', () => expect(sucursalSchema.safeParse(ok).success).toBe(true));
  it('pide ciudad, nombre y dirección', () => {
    const r = sucursalSchema.safeParse({ ciudadId: '', nombre: 'A', direccion: 'Av', telefono: '' });
    expect(r.success).toBe(false);
    const campos = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(campos).toEqual(['ciudadId', 'nombre', 'direccion']);
  });
});

describe('armarSucursalDto', () => {
  it('recorta y omite el teléfono vacío', () => {
    expect(armarSucursalDto({ ciudadId: 'c1', nombre: ' Centro ', direccion: ' Av. Arce 123 ', telefono: '  ' })).toEqual({
      ciudadId: 'c1',
      nombre: 'Centro',
      direccion: 'Av. Arce 123',
      telefono: undefined,
    });
  });
  it('manda el teléfono si está', () => {
    expect(armarSucursalDto({ ciudadId: 'c1', nombre: 'X1', direccion: 'Calle 12', telefono: '777' }).telefono).toBe('777');
  });
});

describe('ciudades', () => {
  it('ordena por nombre', () => {
    const r = ciudadesOrdenadas([
      { id: '2', nombre: 'Sucre', pais: 'Bolivia' },
      { id: '1', nombre: 'El Alto', pais: 'Bolivia' },
    ]);
    expect(r.map((c) => c.nombre)).toEqual(['El Alto', 'Sucre']);
  });
  it('cuenta sucursales por ciudad', () => {
    const s = (ciudadId: string) => ({ ciudadId }) as Sucursal;
    expect(sucursalesPorCiudad([s('a'), s('a'), s('b')])).toEqual({ a: 2, b: 1 });
  });
});
