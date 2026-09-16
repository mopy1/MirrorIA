import { apiFetch } from "@/lib/api"
import type { Proveedor } from "../types/providers.types"

export interface CreateProveedorDto {
  razonSocial: string
  nit?: string
  contactoNombre?: string
  contactoEmail?: string
  contactoTelefono?: string
}

export const providersApi = {
  getProveedores: () => apiFetch<Proveedor[]>("/proveedores"),
  createProveedor: (dto: CreateProveedorDto) =>
    apiFetch<Proveedor>("/proveedores", { method: "POST", body: JSON.stringify(dto) }),
}
