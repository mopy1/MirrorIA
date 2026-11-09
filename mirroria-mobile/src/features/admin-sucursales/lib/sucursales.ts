import { z } from 'zod';
import type { Ciudad, CreateSucursalDto, Sucursal } from '../types/sucursales-admin.types';

/** Mismas reglas que el CreateSucursalDto del backend (nombre ≥ 2, dirección ≥ 5). */
export const sucursalSchema = z.object({
  ciudadId: z.string().min(1, 'Elegí la ciudad'),
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().trim().min(5, 'La dirección debe tener al menos 5 caracteres'),
  telefono: z.string().trim(),
});

export type SucursalFormValues = z.infer<typeof sucursalSchema>;

export const SUCURSAL_VACIA: SucursalFormValues = { ciudadId: '', nombre: '', direccion: '', telefono: '' };

export function armarSucursalDto(v: SucursalFormValues): CreateSucursalDto {
  return {
    ciudadId: v.ciudadId,
    nombre: v.nombre.trim(),
    direccion: v.direccion.trim(),
    telefono: v.telefono.trim() || undefined,
  };
}

/** Ciudades ordenadas por nombre para el selector. */
export function ciudadesOrdenadas(ciudades: Ciudad[]): Ciudad[] {
  return [...ciudades].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Cuántas sucursales hay por ciudad (para la pestaña Ciudades). */
export function sucursalesPorCiudad(sucursales: Sucursal[]): Record<string, number> {
  return sucursales.reduce<Record<string, number>>((acc, s) => {
    acc[s.ciudadId] = (acc[s.ciudadId] ?? 0) + 1;
    return acc;
  }, {});
}
