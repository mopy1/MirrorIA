import { apiFetch } from '@/src/lib/api';
import type { CreateProveedorDto, Proveedor } from '../types/proveedores.types';

/**
 * Mismos endpoints que la web (providersApi). El backend solo tiene alta,
 * listado y detalle de proveedores: no hay edición ni baja (ver informe).
 */
export const proveedoresApi = {
  getProveedores: () => apiFetch<Proveedor[]>('/proveedores'),
  getProveedor: (id: string) => apiFetch<Proveedor>(`/proveedores/${id}`),
  createProveedor: (dto: CreateProveedorDto) => apiFetch<Proveedor>('/proveedores', { method: 'POST', body: JSON.stringify(dto) }),
};
