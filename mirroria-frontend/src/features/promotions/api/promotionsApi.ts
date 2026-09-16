import { apiFetch } from "@/lib/api"
import type { CreateCuponDto, Cupon, ValidarCuponResult } from "../types/promotions.types"

export const promotionsApi = {
  getCupones: () => apiFetch<Cupon[]>("/promociones/cupones"),

  getCupon: (id: string) => apiFetch<Cupon>(`/promociones/cupones/${id}`),

  createCupon: (dto: CreateCuponDto) =>
    apiFetch<Cupon>("/promociones/cupones", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  toggleCuponEstado: (id: string) =>
    apiFetch<Cupon>(`/promociones/cupones/${id}/estado`, {
      method: "PATCH",
    }),

  validarCupon: (codigo: string, subtotalCents: number) =>
    apiFetch<ValidarCuponResult>("/promociones/cupones/validar", {
      method: "POST",
      body: JSON.stringify({ codigo, subtotalCents }),
    }),
}
