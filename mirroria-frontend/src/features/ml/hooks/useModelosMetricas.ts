import { useCallback, useEffect, useState } from "react"
import { getModelosMetricas } from "../api/mlApi"
import type { MetricasModelosResponse } from "../types/ml.types"

export function useModelosMetricas(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const [data, setData] = useState<MetricasModelosResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const ejecutarFetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getModelosMetricas()
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener ficha de modelos")
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    let cancelado = false
    if (!enabled) return
    getModelosMetricas()
      .then((res) => {
        if (!cancelado) setData(res)
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error al obtener ficha de modelos")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [enabled])

  return { data, isLoading, error, reload: ejecutarFetch }
}
