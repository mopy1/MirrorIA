import { apiFetch } from "@/lib/api"
import type { Ciudad, Sucursal } from "../types/branches.types"

export interface CreateSucursalDto {
  ciudadId: string
  nombre: string
  direccion: string
  telefono?: string
}

export const branchesApi = {
  getSucursales: () => apiFetch<Sucursal[]>("/sucursales"),
  createSucursal: (dto: CreateSucursalDto) =>
    apiFetch<Sucursal>("/sucursales", { method: "POST", body: JSON.stringify(dto) }),

  // Ciudades globales (🧭). Crearlas es de la plataforma (features/platform).
  getCiudades: () => apiFetch<Ciudad[]>("/sucursales/ciudades"),
}
