import { apiFetch } from "@/lib/api"
import type { Ciudad } from "@/features/branches/types/branches.types"
import type {
  ActualizarPlanDto, CrearPlanDto, DashboardPlataformaDto, EstadoInquilino, EventoPlataformaDto, FiltrosInquilinos,
  InquilinoDetalleDto, InquilinoResumenDto, MetricasTiendaDto, PlanDto, SeccionMarca,
} from "../types/plataforma.types"

const BASE = "/saas/plataforma"
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

function query(f: FiltrosInquilinos): string {
  const p = new URLSearchParams()
  if (f.estado) p.set("estado", f.estado)
  if (f.suscripcion) p.set("suscripcion", f.suscripcion)
  if (f.plan) p.set("plan", f.plan)
  if (f.orden) p.set("orden", f.orden)
  if (f.q?.trim()) p.set("q", f.q.trim())
  const qs = p.toString()
  return qs ? `?${qs}` : ""
}

// DUENO_PLATAFORMA no tiene tienda: `apiFetch` manda solo el token (sin X-Tenant).
export const plataformaApi = {
  dashboard: () => apiFetch<DashboardPlataformaDto>(`${BASE}/dashboard`),
  actividad: (limite = 20) => apiFetch<EventoPlataformaDto[]>(`${BASE}/actividad?limite=${limite}`),
  metricas: (id: string) => apiFetch<MetricasTiendaDto>(`${BASE}/inquilinos/${id}/metricas`),
  restablecerMarca: (id: string, seccion: SeccionMarca, motivo: string) =>
    apiFetch<InquilinoDetalleDto>(`${BASE}/inquilinos/${id}/marca/restablecer`, json("POST", { seccion, motivo })),
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
