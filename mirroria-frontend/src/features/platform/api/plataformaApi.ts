import { apiFetch } from "@/lib/api"
import type { Ciudad } from "@/features/branches/types/branches.types"
import type {
  ActualizarPlanDto, CrearPlanDto, EstadoInquilino, FiltrosInquilinos, InquilinoDetalleDto,
  InquilinoResumenDto, PlanDto, ResumenPlataformaDto,
} from "../types/plataforma.types"

const BASE = "/saas/plataforma"
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

function query(f: FiltrosInquilinos): string {
  const p = new URLSearchParams()
  if (f.estado) p.set("estado", f.estado)
  if (f.suscripcion) p.set("suscripcion", f.suscripcion)
  if (f.q?.trim()) p.set("q", f.q.trim())
  const qs = p.toString()
  return qs ? `?${qs}` : ""
}

// DUENO_PLATAFORMA no tiene tienda: `apiFetch` manda solo el token (sin X-Tenant).
export const plataformaApi = {
  resumen: () => apiFetch<ResumenPlataformaDto>(`${BASE}/resumen`),
  inquilinos: (f: FiltrosInquilinos = {}) => apiFetch<InquilinoResumenDto[]>(`${BASE}/inquilinos${query(f)}`),
  inquilino: (id: string) => apiFetch<InquilinoDetalleDto>(`${BASE}/inquilinos/${id}`),
  cambiarEstado: (id: string, estado: EstadoInquilino, motivo?: string) =>
    apiFetch<InquilinoDetalleDto>(`${BASE}/inquilinos/${id}/estado`, json("PATCH", { estado, motivo })),
  cambiarPlan: (id: string, planCodigo: string) =>
    apiFetch<InquilinoDetalleDto>(`${BASE}/inquilinos/${id}/plan`, json("PATCH", { planCodigo })),
  extender: (id: string, dias: number) =>
    apiFetch<InquilinoDetalleDto>(`${BASE}/inquilinos/${id}/extender`, json("POST", { dias })),
  planes: () => apiFetch<PlanDto[]>(`${BASE}/planes`),
  crearPlan: (dto: CrearPlanDto) => apiFetch<PlanDto>(`${BASE}/planes`, json("POST", dto)),
  actualizarPlan: (id: string, dto: ActualizarPlanDto) => apiFetch<PlanDto>(`${BASE}/planes/${id}`, json("PATCH", dto)),
  ciudades: () => apiFetch<Ciudad[]>("/sucursales/ciudades"),
  crearCiudad: (dto: { nombre: string; pais: string }) => apiFetch<Ciudad>("/sucursales/ciudades", json("POST", dto)),
}
