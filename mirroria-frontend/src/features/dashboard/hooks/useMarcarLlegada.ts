import { useState } from "react"
import { reservationsApi } from "@/features/reservations/api/reservationsApi"

/** "Ya llegó": pasa la reserva a EN_TIENDA y avisa para recargar el día. */
export function useMarcarLlegada(onHecho?: () => void) {
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)
  const [error, setError] = useState<{ id: string; mensaje: string } | null>(null)

  const marcarLlegada = async (reservaId: string) => {
    setActualizandoId(reservaId)
    setError(null)
    try {
      await reservationsApi.cambiarEstado(reservaId, "EN_TIENDA")
      onHecho?.()
    } catch (err) {
      const detalle = err instanceof Error && err.message ? ` (${err.message})` : ""
      setError({ id: reservaId, mensaje: `No pudimos marcar la llegada${detalle}. Probá de nuevo.` })
    } finally {
      setActualizandoId(null)
    }
  }

  return { marcarLlegada, actualizandoId, error }
}
