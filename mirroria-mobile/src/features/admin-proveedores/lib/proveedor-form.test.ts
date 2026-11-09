import { describe, expect, it } from 'vitest';
import { armarPayloadProveedor, filtrarProveedores, PROVEEDOR_VACIO, proveedorSchema } from './proveedor-form';
import type { Proveedor } from '../types/proveedores.types';

describe('formulario de proveedor', () => {
  it('pide razón social; el resto es opcional', () => {
    expect(proveedorSchema.safeParse(PROVEEDOR_VACIO).success).toBe(false);
    expect(proveedorSchema.safeParse({ ...PROVEEDOR_VACIO, razonSocial: 'Textiles del Sur' }).success).toBe(true);
  });
  it('valida email y teléfono si se cargan', () => {
    const base = { ...PROVEEDOR_VACIO, razonSocial: 'Textiles' };
    expect(proveedorSchema.safeParse({ ...base, contactoEmail: 'mal' }).success).toBe(false);
    expect(proveedorSchema.safeParse({ ...base, contactoEmail: 'ventas@sur.bo', contactoTelefono: '+591 2 242-1180' }).success).toBe(true);
    expect(proveedorSchema.safeParse({ ...base, contactoTelefono: 'llamar' }).success).toBe(false);
  });
  it('arma el cuerpo sin campos vacíos', () => {
    expect(armarPayloadProveedor({ ...PROVEEDOR_VACIO, razonSocial: ' Sur SRL ', contactoEmail: ' a@b.bo ' })).toEqual({
      razonSocial: 'Sur SRL', nit: undefined, contactoNombre: undefined, contactoEmail: 'a@b.bo', contactoTelefono: undefined,
    });
  });
  it('busca por razón social, NIT o contacto', () => {
    const lista = [
      { id: '1', razonSocial: 'Producción propia', nit: null, contactoNombre: null, contactoEmail: null, contactoTelefono: null, activo: true },
      { id: '2', razonSocial: 'Textiles del Sur', nit: '1020304', contactoNombre: 'Marta Quispe', contactoEmail: null, contactoTelefono: null, activo: true },
    ] as Proveedor[];
    expect(filtrarProveedores(lista, 'produccion').map((p) => p.id)).toEqual(['1']);
    expect(filtrarProveedores(lista, '10203').map((p) => p.id)).toEqual(['2']);
    expect(filtrarProveedores(lista, 'quispe').map((p) => p.id)).toEqual(['2']);
    expect(filtrarProveedores(lista, '')).toHaveLength(2);
  });
});
