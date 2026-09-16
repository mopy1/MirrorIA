import { apiFetch } from "@/lib/api"
import type { InventarioSucursal } from "../types/inventory.types"

export interface AjustarStockDto {
  varianteId: string
  sucursalId: string
  /** Delta: positivo suma, negativo resta. */
  cantidad: number
  motivo: string
}

export const inventoryApi = {
  getDisponibilidad: (filtro: { varianteId?: string; sucursalId?: string } = {}) => {
    const params = new URLSearchParams()
    if (filtro.varianteId) params.set("varianteId", filtro.varianteId)
    if (filtro.sucursalId) params.set("sucursalId", filtro.sucursalId)
    const qs = params.toString()
    return apiFetch<InventarioSucursal[]>(`/inventario${qs ? `?${qs}` : ""}`)
  },

  ajustarStock: (dto: AjustarStockDto) =>
    apiFetch<InventarioSucursal>("/inventario/ajustes", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
}
