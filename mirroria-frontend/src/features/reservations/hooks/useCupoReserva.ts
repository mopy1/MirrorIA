import { useCallback, useEffect, useState } from "react"
import { reservationsApi } from "../api/reservationsApi"
import type { CupoReserva } from "../types/reservations.types"

/**
 * Cupo de reservas de la clienta logueada (GET /reservas/mias/cupo). Con
 * `enabled = false` (sin sesión) no pide nada y deja `cupo` en null — el
 * formulario cae en los valores por defecto (30 min / 48 h).
 */
export function useCupoReserva(enabled: boolean) {
  const [cupo, setCupo] = useState<CupoReserva | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled) {
      setCupo(null)
      return
    }
    setIsLoading(true)
    try {
      setCupo(await reservationsApi.getCupo())
    } catch {
      // Sin cupo no se bloquea nada del lado del front: si la regla aplica,
      // el POST /reservas igual devuelve el motivo real del backend.
      setCupo(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    reload()
  }, [reload])

  return { cupo, isLoading, reload }
}
