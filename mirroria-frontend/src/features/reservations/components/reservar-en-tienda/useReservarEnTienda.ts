import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useCreateResource } from "@/hooks/useCreateResource"
import { reservationsApi } from "../../api/reservationsApi"
import { useCupoReserva } from "../../hooks/useCupoReserva"
import { estaEnVentana, ventanaReserva } from "../../lib/ventanaReserva"

/**
 * Lógica de `ReservarEnTienda`: cupo de la clienta, ventana válida de
 * horario y el POST. Siempre reserva 1 unidad (el backend rechaza más).
 */
export function useReservarEnTienda(varianteId: string | null, sucursalId: string | null) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { cupo, reload: recargarCupo } = useCupoReserva(isAuthenticated)
  const [fechaHora, setFechaHora] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const { submit, isLoading, error } = useCreateResource(reservationsApi.create)

  // Se recalcula en cada render (es barato): así "ahora" no queda congelado
  // si la clienta deja la ficha abierta un rato.
  const ventana = ventanaReserva(new Date(), cupo)
  const fueraDeVentana = fechaHora !== "" && !estaEnVentana(fechaHora, ventana)
  const bloqueada = cupo !== null && !cupo.puedeReservar

  async function reservar() {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    if (!varianteId || !sucursalId || !fechaHora || bloqueada) return
    setFeedback(null)
    const result = await submit({
      sucursalId,
      fechaHoraPrevista: new Date(fechaHora).toISOString(),
      items: [{ varianteId, cantidad: 1 }],
    })
    if (result) {
      setFeedback('Reserva creada — la vas a ver en "Mis reservas".')
      setFechaHora("")
    }
    recargarCupo()
  }

  const puedeEnviar = Boolean(varianteId) && fechaHora !== "" && !fueraDeVentana && !bloqueada

  return {
    cupo,
    ventana,
    fechaHora,
    setFechaHora,
    fueraDeVentana,
    bloqueada,
    puedeEnviar,
    reservar,
    isLoading,
    error,
    feedback,
  }
}
