import { ApiError } from "@/lib/api"
import type { Venta } from "@/features/checkout/types/checkout.types"

/** Se puede comprar lo reservado solo cuando el personal la marcó en la tienda. */
export const puedeComprarReserva = (estado: string) => estado === "EN_TIENDA"

/** La compra PENDIENTE (sin pagar) que ya salió de esta reserva, si la hay. */
export function ventaPendienteDeReserva(ventas: Venta[], reservaId: string): Venta | null {
  return ventas.find((v) => v.reservaId === reservaId && v.estado === "PENDIENTE") ?? null
}

/** 403/409 del backend en palabras para la clienta (el 409 ya viene legible). */
export function mensajeErrorCompraReserva(err: unknown): string {
  if (!(err instanceof ApiError)) return "No se pudo iniciar la compra. Probá de nuevo."
  if (err.status === 0) return "Comprar lo reservado necesita conexión a internet."
  if (err.status === 403) return "Esta reserva es de otra cuenta: entrá con la cuenta con la que reservaste."
  if (err.status === 404) return "No encontramos esa reserva. Actualizá la página."
  return err.message
}
