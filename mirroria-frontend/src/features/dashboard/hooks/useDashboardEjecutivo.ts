import { useCallback, useEffect, useState } from "react"
import { getDashboardEjecutivo } from "../api/dashboardApi"
import type { DashboardEjecutivoDto, FiltroDashboardEjecutivo, PeriodoDashboard } from "../types/dashboard.types"

export interface UseDashboardEjecutivoOptions extends FiltroDashboardEjecutivo {
  enabled?: boolean
}

export function useDashboardEjecutivo(options: UseDashboardEjecutivoOptions = {}) {
  const { enabled = true } = options

  const [intPeriodo, setIntPeriodo] = useState<PeriodoDashboard>(options.periodo ?? "30d")
  const [intFechaInicio, setIntFechaInicio] = useState<string | undefined>(options.fechaInicio)
  const [intFechaFin, setIntFechaFin] = useState<string | undefined>(options.fechaFin)
  const [intSucursalId, setIntSucursalId] = useState<string | undefined>(options.sucursalId)

  const periodo = options.periodo !== undefined ? options.periodo : intPeriodo
  const fechaInicio = "fechaInicio" in options ? options.fechaInicio : intFechaInicio
  const fechaFin = "fechaFin" in options ? options.fechaFin : intFechaFin
  const sucursalId = "sucursalId" in options ? options.sucursalId : intSucursalId

  const [data, setData] = useState<DashboardEjecutivoDto | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!enabled) return
    if (periodo === "personalizado" && (!fechaInicio || !fechaFin)) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getDashboardEjecutivo({
        periodo,
        fechaInicio: periodo === "personalizado" ? fechaInicio : undefined,
        fechaFin: periodo === "personalizado" ? fechaFin : undefined,
        sucursalId: sucursalId || undefined,
      })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar dashboard ejecutivo")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, periodo, fechaInicio, fechaFin, sucursalId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    data,
    isLoading,
    error,
    periodo,
    setPeriodo: setIntPeriodo,
    fechaInicio,
    setFechaInicio: setIntFechaInicio,
    fechaFin,
    setFechaFin: setIntFechaFin,
    sucursalId,
    setSucursalId: setIntSucursalId,
    recargar: cargar,
    reload: cargar,
  }
}
