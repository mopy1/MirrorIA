import { apiFetch } from '@/src/lib/api';
import type { SucursalOpcion, UsuarioAdmin } from '../types/usuarios-admin.types';

/**
 * Mismos endpoints que usuariosAdminApi de la web (solo ADMIN). Las reglas
 * (nunca 0 ADMIN, no quitarse el rol a sí misma, límite de staff del plan) las
 * aplica el backend y su mensaje se muestra tal cual.
 */
export const usuariosAdminApi = {
  getUsuarios: () => apiFetch<UsuarioAdmin[]>('/seguridad/usuarios'),

  updateRol: (id: string, role: string, sucursalId?: string) =>
    apiFetch<UsuarioAdmin>(`/seguridad/usuarios/${id}/rol`, {
      method: 'PATCH',
      body: JSON.stringify({ role, sucursalId }),
    }),

  updateEstado: (id: string, isActive: boolean) =>
    apiFetch<UsuarioAdmin>(`/seguridad/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  getSucursales: () => apiFetch<SucursalOpcion[]>('/sucursales'),
};
