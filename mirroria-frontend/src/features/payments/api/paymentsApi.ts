import { apiFetch } from "@/lib/api"
import type {
  CobroQr,
  EstadoCobroQrRespuesta,
  Instrucciones,
  Pago,
} from "../types/payments.types"

export const paymentsApi = {
  /** Efectivo: crea el cobro pendiente y devuelve qué mostrarle a la clienta. */
  iniciarManual: (ventaId: string, metodo: "EFECTIVO") =>
    apiFetch<Instrucciones>(`/pagos/ventas/${ventaId}/manual`, {
      method: "POST",
      body: JSON.stringify({ metodo }),
    }),

  /** Tarjeta: devuelve la url de la pasarela. Responde 503 si el servidor no tiene claves. */
  iniciarTarjeta: (ventaId: string) =>
    apiFetch<{ url: string }>(`/pagos/ventas/${ventaId}/sesion`, { method: "POST" }),

  /** QR: genera (o reutiliza) el QR de la compra. Se acredita solo cuando el banco avisa. */
  iniciarQr: (ventaId: string) =>
    apiFetch<CobroQr>(`/pagos/ventas/${ventaId}/qr`, { method: "POST" }),

  estadoQr: (pagoId: string) => apiFetch<EstadoCobroQrRespuesta>(`/pagos/qr/${pagoId}`),

  pendientes: () => apiFetch<Pago[]>("/pagos/pendientes"),

  confirmar: (pagoId: string) =>
    apiFetch<Pago>(`/pagos/${pagoId}/confirmar`, { method: "POST" }),
}
