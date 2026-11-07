import { apiFetch } from "@/lib/api"
import type { Venta } from "@/features/checkout/types/checkout.types"
import type { CupoReserva, Reserva } from "../types/reservations.types"

export interface CreateReservaDto {
  sucursalId: string
  fechaHoraPrevista: string
  items: { varianteId: string; cantidad: number }[]
}

export const reservationsApi = {
  create: (dto: CreateReservaDto) =>
    apiFetch<Reserva>("/reservas", { method: "POST", body: JSON.stringify(dto) }),

  getMisReservas: () => apiFetch<Reserva[]>("/reservas/mias"),

  getCupo: () => apiFetch<CupoReserva>("/reservas/mias/cupo"),

  cancelar: (id: string) => apiFetch<Reserva>(`/reservas/${id}/cancelar`, { method: "PATCH" }),

  /** "Comprar lo que reservé": solo la dueña y con la reserva EN_TIENDA. Devuelve la venta PENDIENTE (se paga como el checkout). */
  comprar: (reservaId: string, codigoCupon?: string) =>
    apiFetch<Venta>(`/ventas/desde-reserva/${reservaId}`, {
      method: "POST",
      body: JSON.stringify({ canal: "WEB", ...(codigoCupon ? { codigoCupon } : {}) }),
    }),

  // Staff (ADMIN/ENCARGADO_SUCURSAL)
  getAll: (filtro: { sucursalId?: string; estado?: string } = {}) => {
    const params = new URLSearchParams()
    if (filtro.sucursalId) params.set("sucursalId", filtro.sucursalId)
    if (filtro.estado) params.set("estado", filtro.estado)
    const qs = params.toString()
    return apiFetch<Reserva[]>(`/reservas${qs ? `?${qs}` : ""}`)
  },

  cambiarEstado: (id: string, estado: string) =>
    apiFetch<Reserva>(`/reservas/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
}
