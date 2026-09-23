import { apiFetch } from "@/lib/api"
import type { Instrucciones, MetodoPago, Pago } from "../types/payments.types"

export const paymentsApi = {
  /** Efectivo: crea el cobro pendiente y devuelve qué mostrarle a la clienta. */
  iniciarManual: (ventaId: string, metodo: Exclude<MetodoPago, "TARJETA">) =>
    apiFetch<Instrucciones>(`/pagos/ventas/${ventaId}/manual`, {
      method: "POST",
      body: JSON.stringify({ metodo }),
    }),

  /** Tarjeta: devuelve la url de la pasarela. Responde 503 si el servidor no tiene claves. */
  iniciarTarjeta: (ventaId: string) =>
    apiFetch<{ url: string }>(`/pagos/ventas/${ventaId}/sesion`, { method: "POST" }),

  pendientes: () => apiFetch<Pago[]>("/pagos/pendientes"),

  confirmar: (pagoId: string) =>
    apiFetch<Pago>(`/pagos/${pagoId}/confirmar`, { method: "POST" }),
}
