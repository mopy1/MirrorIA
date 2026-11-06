import { useCallback, useEffect, useState } from "react"
import { getDashboardOperativo } from "../api/dashboardApi"
import type { DashboardOperativoDto, FiltroDashboardOperativo } from "../types/dashboard.types"

export interface UseDashboardOperativoOptions extends FiltroDashboardOperativo {
  enabled?: boolean
}

export function useDashboardOperativo(options: UseDashboardOperativoOptions = {}) {
  const { enabled = true } = options

  const [intSucursalId, setIntSucursalId] = useState<string | undefined>(options.sucursalId)
  const sucursalId = "sucursalId" in options ? options.sucursalId : intSucursalId

  const [data, setData] = useState<DashboardOperativoDto | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getDashboardOperativo({ sucursalId: sucursalId || undefined })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar dashboard operativo")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, sucursalId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    data,
    isLoading,
    error,
    sucursalId,
    setSucursalId: setIntSucursalId,
    recargar: cargar,
    reload: cargar,
  }
}
