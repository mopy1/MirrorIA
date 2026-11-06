import { useCallback, useEffect, useState } from "react"
import { getAnomalias, getDemanda, getModelosMetricas, getNoShowAgenda, getRfmSegmentos } from "../api/mlApi"
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
