import { useCallback, useEffect, useState } from "react"
import { getNoShowAgenda } from "../api/mlApi"
import type { FiltroNoShow, NoShowAgendaResponse } from "../types/ml.types"

export function useNoShowAgenda(options: FiltroNoShow & { enabled?: boolean } = {}) {
  const { sucursalId, reservaId, enabled = true } = options
  const [data, setData] = useState<NoShowAgendaResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const ejecutarFetch = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getNoShowAgenda({ sucursalId, reservaId })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al evaluar agenda de no-show")
    } finally {
      setIsLoading(false)
    }
  }, [enabled, sucursalId, reservaId])

  useEffect(() => {
    let cancelado = false
    if (!enabled) return
    getNoShowAgenda({ sucursalId, reservaId })
      .then((res) => {
        if (!cancelado) setData(res)
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error al evaluar agenda de no-show")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [enabled, sucursalId, reservaId])

  return { data, isLoading, error, reload: ejecutarFetch }
}
