import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"
import { suscripcionApi } from "../api/suscripcionApi"
import type { EstadoCobroSuscripcionResponseDto } from "../types/suscripcion.types"

const INTERVALO_POLLING_MS = 2500

export function useEstadoCobroSuscripcion(
  cobroId: string | null,
  onAcreditado?: (res: EstadoCobroSuscripcionResponseDto) => void,
) {
  const [estado, setEstado] = useState<EstadoCobroSuscripcionResponseDto | null>(null)
  const [isLoadingSimulacion, setIsLoadingSimulacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onAcreditadoRef = useRef(onAcreditado)

  useEffect(() => {
    onAcreditadoRef.current = onAcreditado
  }, [onAcreditado])

  const consultarEstado = useCallback(async (id: string) => {
    try {
      const res = await suscripcionApi.estadoCobro(id)
      setEstado(res)
      if (res.pagado) {
        onAcreditadoRef.current?.(res)
      }
      return res
    } catch {
      // Un fallo transitorio de red no debe tumbar la UI
      return null
    }
  }, [])

  useEffect(() => {
    if (!cobroId) {
      setEstado(null)
      setError(null)
      return
    }

    let activo = true
    let timer: ReturnType<typeof setTimeout> | null = null

    async function poll() {
      if (!cobroId || !activo) return
      const res = await consultarEstado(cobroId)
      if (activo && (!res || !res.pagado)) {
        timer = setTimeout(poll, INTERVALO_POLLING_MS)
      }
    }

    void poll()

    return () => {
      activo = false
      if (timer) clearTimeout(timer)
    }
  }, [cobroId, consultarEstado])

  async function simularPago() {
    if (!cobroId) return
    setIsLoadingSimulacion(true)
    setError(null)
    try {
      const res = await suscripcionApi.simularPago(cobroId)
      setEstado(res)
      if (res.pagado) {
        onAcreditadoRef.current?.(res)
      }
      return res
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al simular el pago"
      setError(msg)
      return null
    } finally {
      setIsLoadingSimulacion(false)
    }
  }

  return {
    estado,
    pagado: estado?.pagado ?? false,
    isLoadingSimulacion,
    error,
    simularPago,
  }
}
