import { useCallback, useEffect, useState } from "react"
import { getDashboardEjecutivo } from "../api/dashboardApi"
import type { DashboardEjecutivoDto, FiltroDashboardEjecutivo, PeriodoDashboard } from "../types/dashboard.types"

export interface UseDashboardEjecutivoOptions extends FiltroDashboardEjecutivo {
  enabled?: boolean
}

export function useDashboardEjecutivo(options: UseDashboardEjecutivoOptions = {}) {
  const {
    periodo: initialPeriodo = "30d",
    fechaInicio: initialFechaInicio,
    fechaFin: initialFechaFin,
    sucursalId: initialSucursalId,
    enabled = true,
  } = options

  const [periodo, setPeriodo] = useState<PeriodoDashboard>(initialPeriodo)
  const [fechaInicio, setFechaInicio] = useState<string | undefined>(initialFechaInicio)
  const [fechaFin, setFechaFin] = useState<string | undefined>(initialFechaFin)
  const [sucursalId, setSucursalId] = useState<string | undefined>(initialSucursalId)

  const [data, setData] = useState<DashboardEjecutivoDto | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getDashboardEjecutivo({
        periodo,
        fechaInicio,
        fechaFin,
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
    setPeriodo,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    sucursalId,
    setSucursalId,
    recargar: cargar,
    reload: cargar,
  }
}
