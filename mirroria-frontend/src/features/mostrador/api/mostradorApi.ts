import { apiFetch } from "@/lib/api"
import type { ItemMostrador, VentaPayload } from "../lib/venta-mostrador"

export interface VentaRegistrada {
  id: string
  numeroComprobante: string | null
  totalCents: number
}

export const mostradorApi = {
  getCatalogo: (sucursalId: string) =>
    apiFetch<ItemMostrador[]>(`/inventario/mostrador?sucursalId=${encodeURIComponent(sucursalId)}`),
  registrarVenta: (payload: VentaPayload, clave: string) =>
    apiFetch<VentaRegistrada>("/ventas/presenciales", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": clave },
    }),
}
