import { apiFetch } from "@/lib/api"
import type { Reserva } from "../types/reservations.types"

export interface CreateReservaDto {
  sucursalId: string
  fechaHoraPrevista: string
  items: { varianteId: string; cantidad: number }[]
}

export const reservationsApi = {
  create: (dto: CreateReservaDto) =>
    apiFetch<Reserva>("/reservas", { method: "POST", body: JSON.stringify(dto) }),

  getMisReservas: () => apiFetch<Reserva[]>("/reservas/mias"),

  cancelar: (id: string) => apiFetch<Reserva>(`/reservas/${id}/cancelar`, { method: "PATCH" }),

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
