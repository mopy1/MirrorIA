import { useCallback, useEffect, useState } from "react"
import { getRfmSegmentos } from "../api/mlApi"
import type { RfmSegmentosResponse } from "../types/ml.types"

export function useRfmSegmentos(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const [data, setData] = useState<RfmSegmentosResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const ejecutarFetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getRfmSegmentos()
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al segmentar clientas por RFM")
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    let cancelado = false
    if (!enabled) return
    getRfmSegmentos()
      .then((res) => {
        if (!cancelado) setData(res)
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error al segmentar clientas por RFM")
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
