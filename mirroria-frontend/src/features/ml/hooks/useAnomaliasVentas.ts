import { useCallback, useEffect, useState } from "react"
import { getAnomalias } from "../api/mlApi"
import type { AnomaliasVentasResponse, FiltroAnomalias } from "../types/ml.types"

export function useAnomaliasVentas(options: FiltroAnomalias & { enabled?: boolean } = {}) {
  const { sucursalId, enabled = true } = options
  const [data, setData] = useState<AnomaliasVentasResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const ejecutarFetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAnomalias({ sucursalId })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al auditar transacciones anómalas")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, sucursalId])

  useEffect(() => {
    let cancelado = false
    if (!enabled) return
    getAnomalias({ sucursalId })
      .then((res) => {
        if (!cancelado) setData(res)
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error al auditar transacciones anómalas")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [enabled, sucursalId])

  return { data, isLoading, error, reload: ejecutarFetch }
}
