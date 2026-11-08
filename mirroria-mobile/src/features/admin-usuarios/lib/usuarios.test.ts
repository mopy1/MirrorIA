import { describe, expect, it } from 'vitest';
import {
  armarCambioRol, etiquetaRol, filtrarUsuarios, hayCambios, MSJ_SUCURSAL_OBLIGATORIA, rolSchema, sinSucursal, valoresRol,
} from './usuarios';
import type { UsuarioAdmin } from '../types/usuarios-admin.types';

const u = (over: Partial<UsuarioAdmin> = {}): UsuarioAdmin => ({
  id: '1', email: 'ana@x.bo', fullName: 'Ana Pérez', role: 'CUSTOMER', sucursalId: null, isActive: true, createdAt: '', ...over,
});

describe('rolSchema', () => {
  it('staff sin sucursal no pasa', () => {
    const r = rolSchema.safeParse({ role: 'CAJERO', sucursalId: '' });
    expect(r.success).toBe(false);
    expect(r.success ? '' : r.error.issues[0].message).toBe(MSJ_SUCURSAL_OBLIGATORIA);
  });
  it('admin y cliente no necesitan sucursal', () => {
    expect(rolSchema.safeParse({ role: 'ADMIN', sucursalId: '' }).success).toBe(true);
    expect(rolSchema.safeParse({ role: 'CUSTOMER', sucursalId: '' }).success).toBe(true);
  });
});

describe('armarCambioRol', () => {
  it('solo staff manda sucursal', () => {
    expect(armarCambioRol({ role: 'ENCARGADO_SUCURSAL', sucursalId: 's1' })).toEqual({ role: 'ENCARGADO_SUCURSAL', sucursalId: 's1' });
    expect(armarCambioRol({ role: 'ADMIN', sucursalId: 's1' })).toEqual({ role: 'ADMIN', sucursalId: undefined });
  });
});

describe('hayCambios', () => {
  it('sin cambios', () => expect(hayCambios(u(), valoresRol(u()))).toBe(false));
  it('cambia el rol', () => expect(hayCambios(u(), { role: 'ADMIN', sucursalId: '' })).toBe(true));
  it('cambia la sucursal', () => {
    const cajera = u({ role: 'CAJERO', sucursalId: 's1' });
    expect(hayCambios(cajera, { role: 'CAJERO', sucursalId: 's2' })).toBe(true);
  });
  it('sucursal elegida pero rol sin sucursal no cuenta', () => expect(hayCambios(u(), { role: 'CUSTOMER', sucursalId: 's1' })).toBe(false));
});

describe('varios', () => {
  it('etiquetas', () => {
    expect(etiquetaRol('ENCARGADO_SUCURSAL')).toBe('Encargado de Sucursal');
    expect(etiquetaRol('RARO')).toBe('RARO');
  });
  it('sin sucursal asignada', () => {
    expect(sinSucursal(u({ role: 'CAJERO' }))).toBe(true);
    expect(sinSucursal(u({ role: 'ADMIN' }))).toBe(false);
  });
  it('filtra por texto y rol', () => {
    const lista = [u(), u({ id: '2', fullName: 'Rosa', email: 'rosa@casa.bo', role: 'ADMIN' })];
    expect(filtrarUsuarios(lista, 'ROSA', 'TODOS').map((x) => x.id)).toEqual(['2']);
    expect(filtrarUsuarios(lista, '', 'CUSTOMER').map((x) => x.id)).toEqual(['1']);
    expect(filtrarUsuarios(lista, 'casa.bo', 'CUSTOMER')).toEqual([]);
  });
});
