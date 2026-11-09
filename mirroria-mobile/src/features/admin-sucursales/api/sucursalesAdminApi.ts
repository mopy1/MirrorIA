import { apiFetch } from '@/src/lib/api';
import type { Ciudad, CreateSucursalDto, Sucursal } from '../types/sucursales-admin.types';

/** Mismos endpoints que branchesApi de la web. Crear sucursal es solo ADMIN; el backend no tiene edición ni baja. */
export const sucursalesAdminApi = {
  getSucursales: () => apiFetch<Sucursal[]>('/sucursales'),
  createSucursal: (dto: CreateSucursalDto) =>
    apiFetch<Sucursal>('/sucursales', { method: 'POST', body: JSON.stringify(dto) }),
  /** Ciudades globales: las da de alta la plataforma; la tienda solo las elige. */
  getCiudades: () => apiFetch<Ciudad[]>('/sucursales/ciudades'),
};
