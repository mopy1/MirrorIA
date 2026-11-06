import { apiFetch } from "@/lib/api"
import type {
  DashboardEjecutivoDto,
  DashboardOperativoDto,
  FiltroDashboardEjecutivo,
  FiltroDashboardOperativo,
} from "../types/dashboard.types"

export async function getDashboardEjecutivo(
  params?: FiltroDashboardEjecutivo,
): Promise<DashboardEjecutivoDto> {
  const searchParams = new URLSearchParams()
  if (params?.periodo) searchParams.set("periodo", params.periodo)
  if (params?.fechaInicio) searchParams.set("fechaInicio", params.fechaInicio)
  if (params?.fechaFin) searchParams.set("fechaFin", params.fechaFin)
  if (params?.sucursalId) searchParams.set("sucursalId", params.sucursalId)
  const qs = searchParams.toString()
  return apiFetch<DashboardEjecutivoDto>(`/dashboard/ejecutivo${qs ? `?${qs}` : ""}`)
}

export async function getDashboardOperativo(
  params?: FiltroDashboardOperativo,
): Promise<DashboardOperativoDto> {
  const searchParams = new URLSearchParams()
  if (params?.sucursalId) searchParams.set("sucursalId", params.sucursalId)
  const qs = searchParams.toString()
  return apiFetch<DashboardOperativoDto>(`/dashboard/operativo${qs ? `?${qs}` : ""}`)
}

export const dashboardApi = {
  getDashboardEjecutivo,
  getDashboardOperativo,
}
