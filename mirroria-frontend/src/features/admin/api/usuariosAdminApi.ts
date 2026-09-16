import { apiFetch } from "@/lib/api"

// Vive en `features/admin/` (no en `features/auth/`) porque es pura gestión
// interna (RF02) — auth.types.ts/authApi.ts son del propio usuario logueado
// (login/registro/perfil), un dominio distinto al de administrar cuentas
// ajenas.
export interface UsuarioAdmin {
  id: string
  email: string
  fullName: string
  role: string
  sucursalId: string | null
  isActive: boolean
  createdAt: string
}

export const usuariosAdminApi = {
  getUsuarios: () => apiFetch<UsuarioAdmin[]>("/seguridad/usuarios"),

  updateRol: (id: string, role: string, sucursalId?: string) =>
    apiFetch<UsuarioAdmin>(`/seguridad/usuarios/${id}/rol`, {
      method: "PATCH",
      body: JSON.stringify({ role, sucursalId }),
    }),

  updateEstado: (id: string, isActive: boolean) =>
    apiFetch<UsuarioAdmin>(`/seguridad/usuarios/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
}
