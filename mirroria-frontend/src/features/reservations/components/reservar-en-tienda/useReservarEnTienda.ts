import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useCreateResource } from "@/hooks/useCreateResource"
import { reservationsApi } from "../../api/reservationsApi"
import { useCupoReserva } from "../../hooks/useCupoReserva"
import { estaEnVentana, ventanaReserva } from "../../lib/ventanaReserva"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useTienda } from "@/hooks/useTienda"
import { encolarReserva } from "@/lib/offline/operaciones-clienta"
import { hayRed } from "@/lib/offline/red-simulada"

/**
 * Lógica de `ReservarEnTienda`: cupo de la clienta, ventana válida de
 * horario y el POST. Siempre reserva 1 unidad (el backend rechaza más).
 * Sin red la reserva va a la outbox (RESERVA_CREAR) "Pendiente de confirmar".
 */
export function useReservarEnTienda(varianteId: string | null, sucursalId: string | null, descripcion = "Reserva") {
  const ruta = useRutaTienda()
  const user = useSesionEnTienda()
  const isAuthenticated = user !== null
  const { slug } = useTienda()
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
      navigate(ruta("/login"))
      return
    }
    if (!varianteId || !sucursalId || !fechaHora || bloqueada) return
    setFeedback(null)
    const dto = { sucursalId, fechaHoraPrevista: new Date(fechaHora).toISOString(), items: [{ varianteId, cantidad: 1 }] }
    if (!hayRed() && user && slug) {
      await encolarReserva({ tenantId: slug, usuarioId: user.id, descripcion, dto })
      setFeedback('Sin conexión: la reserva quedó pendiente de confirmar. Se envía sola al volver la red (la ves en "Mis reservas").')
      setFechaHora("")
      return
    }
    const result = await submit(dto)
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
