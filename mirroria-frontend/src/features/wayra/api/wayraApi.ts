import { apiFetch } from "@/lib/api"
import type { CobroWayra, ComprobanteWayra } from "../types/wayra.types"

/** La "app del banco" no tiene sesión: el token del QR es la única llave. */
export const wayraApi = {
  verCobro: (token: string) => apiFetch<CobroWayra>(`/wayra/cobros/${encodeURIComponent(token)}`),

  pagar: (token: string, cuenta: string, pin: string) =>
    apiFetch<ComprobanteWayra>(`/wayra/cobros/${encodeURIComponent(token)}/pagar`, {
      method: "POST",
      body: JSON.stringify({ cuenta, pin }),
    }),
}
