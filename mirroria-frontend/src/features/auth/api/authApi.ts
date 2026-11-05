import { apiFetch } from "@/lib/api"
import type { AuthResponse, LoginRequest, RegisterRequest, UsuarioResponse } from "../types/auth.types"

export const authApi = {
  /** Con `X-Tenant` (la tienda navegada) busca en esa tienda; `plataforma` va sin tienda. */
  login: (data: LoginRequest, plataforma = false) =>
    apiFetch<AuthResponse>(
      "/seguridad/auth/login",
      { method: "POST", body: JSON.stringify(data) },
      plataforma ? "ninguno" : "auto",
    ),

  /** Requiere `X-Tenant`: crea la clienta en la tienda navegada. */
  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>("/seguridad/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Siempre con la sesión propia, aunque se esté navegando otra tienda.
  getMe: () => apiFetch<UsuarioResponse>("/seguridad/auth/me", {}, "sesion"),
}
