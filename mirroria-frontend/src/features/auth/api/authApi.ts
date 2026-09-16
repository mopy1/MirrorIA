import { apiFetch } from "@/lib/api"
import type { AuthResponse, LoginRequest, RegisterRequest, UsuarioResponse } from "../types/auth.types"

export const authApi = {
  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>("/seguridad/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>("/seguridad/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => apiFetch<UsuarioResponse>("/seguridad/auth/me"),
}
