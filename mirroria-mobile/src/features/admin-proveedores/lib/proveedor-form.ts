import { z } from 'zod';
import { normalizar } from '../../admin-catalogo/lib/texto';
import type { CreateProveedorDto, Proveedor } from '../types/proveedores.types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const proveedorSchema = z.object({
  razonSocial: z.string().trim().min(2, 'Escribí la razón social (mínimo 2 letras)'),
  nit: z.string(),
  contactoNombre: z.string(),
  contactoEmail: z.string().trim().refine((v) => v === '' || EMAIL.test(v), 'Email inválido'),
  contactoTelefono: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[+\d][\d\s-]{5,}$/.test(v), 'Teléfono inválido (solo números, espacios o guiones)'),
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;

export const PROVEEDOR_VACIO: ProveedorFormValues = { razonSocial: '', nit: '', contactoNombre: '', contactoEmail: '', contactoTelefono: '' };

const opcional = (v: string) => v.trim() || undefined;

/** Igual que la web: los campos vacíos no viajan. */
export function armarPayloadProveedor(v: ProveedorFormValues): CreateProveedorDto {
  return {
    razonSocial: v.razonSocial.trim(),
    nit: opcional(v.nit),
    contactoNombre: opcional(v.contactoNombre),
    contactoEmail: opcional(v.contactoEmail),
    contactoTelefono: opcional(v.contactoTelefono),
  };
}

export function filtrarProveedores(lista: Proveedor[], busqueda: string): Proveedor[] {
  const q = normalizar(busqueda);
  if (!q) return lista;
  return lista.filter((p) => normalizar([p.razonSocial, p.nit, p.contactoNombre, p.contactoEmail].filter(Boolean).join(' ')).includes(q));
}
