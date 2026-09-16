import { apiFetch } from "@/lib/api"
import type { Venta } from "../types/checkout.types"

export const checkoutApi = {
  checkout: (usuarioId: string, sucursalId: string, codigoCupon?: string) =>
    apiFetch<Venta>(`/ventas/carrito/${usuarioId}/checkout`, {
      method: "POST",
      body: JSON.stringify({
        sucursalId,
        canal: "WEB",
        ...(codigoCupon ? { codigoCupon } : {}),
      }),
    }),

  getVenta: (id: string) => apiFetch<Venta>(`/ventas/${id}`),

  getVentas: (filtro: { sucursalId?: string } = {}) => {
    const params = new URLSearchParams()
    if (filtro.sucursalId) params.set("sucursalId", filtro.sucursalId)
    const qs = params.toString()
    return apiFetch<Venta[]>(`/ventas${qs ? `?${qs}` : ""}`)
  },
}
