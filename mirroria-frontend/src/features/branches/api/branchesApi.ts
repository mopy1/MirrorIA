import { apiFetch } from "@/lib/api"
import type { Ciudad, Sucursal } from "../types/branches.types"

export interface CreateCiudadDto {
  nombre: string
  pais: string
}

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

  getCiudades: () => apiFetch<Ciudad[]>("/sucursales/ciudades"),
  createCiudad: (dto: CreateCiudadDto) =>
    apiFetch<Ciudad>("/sucursales/ciudades", { method: "POST", body: JSON.stringify(dto) }),
}
