import { apiFetch } from "@/lib/api"
import type { Ciudad } from "@/features/branches/types/branches.types"
import type { TiendaPublica } from "@/types/tienda.types"
import type { DisponibilidadSlugDto, PlanDto, RegistrarTiendaDto, RegistroTiendaResponse } from "../types/saas.types"

// Todas son rutas globales (🧭): sin X-Tenant ni token, así una tienda no
// disponible no tumba la consulta con 403 (el front necesita ver `disponible`).
export const saasApi = {
  getPlanes: () => apiFetch<PlanDto[]>("/saas/planes", {}, "ninguno"),
  getTiendas: (limite = 12) => apiFetch<TiendaPublica[]>(`/saas/tiendas?limite=${limite}`, {}, "ninguno"),
  getDisponibilidad: (slug: string) =>
    apiFetch<DisponibilidadSlugDto>(`/saas/tiendas/disponibilidad?slug=${encodeURIComponent(slug)}`, {}, "ninguno"),
  resolverTienda: (slug: string) => apiFetch<TiendaPublica>(`/saas/tiendas/${encodeURIComponent(slug)}`, {}, "ninguno"),
  registrarTienda: (dto: RegistrarTiendaDto) =>
    apiFetch<RegistroTiendaResponse>("/saas/tiendas", { method: "POST", body: JSON.stringify(dto) }, "ninguno"),
  getCiudades: () => apiFetch<Ciudad[]>("/sucursales/ciudades", {}, "ninguno"),
}
