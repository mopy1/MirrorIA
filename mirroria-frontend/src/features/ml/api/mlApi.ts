import { apiFetch } from "@/lib/api"
import type {
  AnomaliasVentasResponse,
  DemandaMlResponse,
  FiltroAnomalias,
  FiltroDemanda,
  FiltroNoShow,
  MetricasModelosResponse,
  NoShowAgendaResponse,
  RfmSegmentosResponse,
} from "../types/ml.types"

export async function getDemanda(params?: FiltroDemanda): Promise<DemandaMlResponse> {
  const query = new URLSearchParams()
  if (params?.dias) query.set("dias", String(params.dias))
  if (params?.sucursalId) query.set("sucursalId", params.sucursalId)
  const qs = query.toString()
  return apiFetch<DemandaMlResponse>(`/ml/kpis/demanda${qs ? `?${qs}` : ""}`)
}

export async function getNoShowAgenda(params?: FiltroNoShow): Promise<NoShowAgendaResponse> {
  const query = new URLSearchParams()
  if (params?.sucursalId) query.set("sucursalId", params.sucursalId)
  if (params?.reservaId) query.set("reservaId", params.reservaId)
  const qs = query.toString()
  return apiFetch<NoShowAgendaResponse>(`/ml/kpis/no-show/agenda-hoy${qs ? `?${qs}` : ""}`)
}

export async function getRfmSegmentos(): Promise<RfmSegmentosResponse> {
  return apiFetch<RfmSegmentosResponse>("/ml/kpis/rfm/segmentos")
}

export async function getAnomalias(params?: FiltroAnomalias): Promise<AnomaliasVentasResponse> {
  const query = new URLSearchParams()
  if (params?.sucursalId) query.set("sucursalId", params.sucursalId)
  const qs = query.toString()
  return apiFetch<AnomaliasVentasResponse>(`/ml/kpis/anomalias/recientes${qs ? `?${qs}` : ""}`)
}

export async function getModelosMetricas(): Promise<MetricasModelosResponse> {
  return apiFetch<MetricasModelosResponse>("/ml/modelos/metricas")
}

export const mlApi = {
  getDemanda,
  getNoShowAgenda,
  getRfmSegmentos,
  getAnomalias,
  getModelosMetricas,
}
