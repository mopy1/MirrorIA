import type { TenantSesion } from "@/types/tienda.types"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

// Coincide con RolUsuario en mirroria-backend (modules/seguridad/entities/usuario.entity.ts)
export type UsuarioRole = "CUSTOMER" | "ADMIN" | "ENCARGADO_SUCURSAL" | "CAJERO" | "DUENO_PLATAFORMA"

export interface UsuarioResponse {
  id: string
  email: string
  fullName: string
  role: UsuarioRole
  sucursalId: string | null
  /** null solo para DUENO_PLATAFORMA. */
  tenant: TenantSesion | null
}

export interface AuthResponse {
  accessToken: string
  usuario: UsuarioResponse
}
