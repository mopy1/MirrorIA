import { useCallback, useEffect, useState } from "react"
import { getDemanda } from "../api/mlApi"
import type { DemandaMlResponse, FiltroDemanda } from "../types/ml.types"

export function useDemandaMl(options: FiltroDemanda & { enabled?: boolean } = {}) {
  const { dias = 30, sucursalId, enabled = true } = options
  const [data, setData] = useState<DemandaMlResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const ejecutarFetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getDemanda({ dias, sucursalId })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar predicción de demanda")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, dias, sucursalId])

  useEffect(() => {
    let cancelado = false
    if (!enabled) return
    getDemanda({ dias, sucursalId })
      .then((res) => {
        if (!cancelado) setData(res)
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error al cargar predicción de demanda")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [enabled, dias, sucursalId])

  return { data, isLoading, error, reload: ejecutarFetch }
}
