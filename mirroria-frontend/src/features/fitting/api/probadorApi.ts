import { apiFetch } from "@/lib/api"

export interface TokenProbador {
  /** API key efímera (10 min) — la real (DECART_API_KEY) nunca sale del backend. */
  apiKey: string
  expiresAt: string
}

export const probadorApi = {
  obtenerToken: () => apiFetch<TokenProbador>("/probador/token", { method: "POST" }),
}
