import { errorDeSlug, slugDesdeNombre } from './slug';
import type { CodigoPaleta, RegistrarTiendaDto } from '../types/saas.types';

export interface FormRegistro {
  planCodigo: string;
  tienda: { nombre: string; slug: string; paleta: CodigoPaleta };
  sucursal: { nombre: string; direccion: string; ciudadId: string; telefono: string };
  admin: { fullName: string; email: string; password: string };
}

export type ErroresRegistro = Partial<Record<string, string>>;

export const PASOS_REGISTRO = ['Plan', 'Tu tienda y sucursal', 'Tu cuenta'] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formVacio(planCodigo = '', paleta: CodigoPaleta = 'grafito'): FormRegistro {
  return {
    planCodigo,
    tienda: { nombre: '', slug: '', paleta },
    sucursal: { nombre: '', direccion: '', ciudadId: '', telefono: '' },
    admin: { fullName: '', email: '', password: '' },
  };
}

/** Misma validación por paso que la web y el backend (spec §6.2). */
export function validarPaso(paso: number, f: FormRegistro): ErroresRegistro {
  const e: ErroresRegistro = {};
  if (paso === 0 && !f.planCodigo) e.planCodigo = 'Elegí un plan';
  if (paso === 1) {
    if (f.tienda.nombre.trim().length < 3) e['tienda.nombre'] = 'Mínimo 3 caracteres';
    const slug = errorDeSlug(f.tienda.slug);
    if (slug) e['tienda.slug'] = slug;
    if (f.sucursal.nombre.trim().length < 3) e['sucursal.nombre'] = 'Mínimo 3 caracteres';
    if (f.sucursal.direccion.trim().length < 5) e['sucursal.direccion'] = 'Mínimo 5 caracteres';
    if (!f.sucursal.ciudadId) e['sucursal.ciudadId'] = 'Elegí la ciudad';
  }
  if (paso === 2) {
    if (f.admin.fullName.trim().length < 2) e['admin.fullName'] = 'Ingresá tu nombre completo';
    if (!EMAIL.test(f.admin.email.trim())) e['admin.email'] = 'Email inválido';
    if (f.admin.password.length < 8) e['admin.password'] = 'Mínimo 8 caracteres';
  }
  return e;
}

/**
 * Cambia un campo. El slug se sugiere desde el nombre mientras la persona no
 * lo haya editado a mano (`slugTocado`).
 */
export function cambiarCampo<K extends 'tienda' | 'sucursal' | 'admin'>(
  f: FormRegistro,
  grupo: K,
  campo: keyof FormRegistro[K],
  valor: string,
  slugTocado: boolean,
): FormRegistro {
  const next = { ...f, [grupo]: { ...f[grupo], [campo]: valor } } as FormRegistro;
  if (grupo === 'tienda' && campo === 'nombre' && !slugTocado) {
    next.tienda = { ...next.tienda, slug: slugDesdeNombre(valor) };
  }
  return next;
}

/** El cuerpo del `POST /saas/tiendas`: recorta, baja el email y omite el teléfono vacío. */
export function armarDto(f: FormRegistro): RegistrarTiendaDto {
  const { telefono, ...sucursal } = f.sucursal;
  return {
    planCodigo: f.planCodigo,
    tienda: { nombre: f.tienda.nombre.trim(), slug: f.tienda.slug, paleta: f.tienda.paleta },
    sucursal: {
      nombre: sucursal.nombre.trim(),
      direccion: sucursal.direccion.trim(),
      ciudadId: sucursal.ciudadId,
      ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
    },
    admin: { ...f.admin, fullName: f.admin.fullName.trim(), email: f.admin.email.trim().toLowerCase() },
  };
}
