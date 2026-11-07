import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useCart } from "@/hooks/useCart"
import { ApiError } from "@/lib/api"
import { useRutaTienda } from "@/hooks/useRutaTienda"

/**
 * "Agregar al carrito" de la ficha. Muestra el mensaje real del backend si
 * falla (p. ej. 409 "Podés llevar hasta 3 unidades de la misma talla y
 * color") en vez de tragarse el error y avisar un éxito falso.
 */
export function useAgregarAlCarrito() {
  const ruta = useRutaTienda()
  const isAuthenticated = useSesionEnTienda() !== null
  const { addItem, isLoading } = useCart()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Sin red va a la outbox: se avisa "Pendiente de confirmar", nunca "agregado" (RN09). */
  async function agregar(varianteId: string | undefined, descripcion?: string) {
    if (!isAuthenticated) {
      navigate(ruta("/login"))
      return
    }
    if (!varianteId) return
    setFeedback(null)
    setError(null)
    try {
      const resultado = await addItem(varianteId, 1, descripcion)
      setFeedback(
        resultado === "ENCOLADA"
          ? "Sin conexión: la guardamos en este dispositivo. Queda pendiente de confirmar y se envía sola al volver la red."
          : "Se agregó al carrito."
      )
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "No se pudo agregar al carrito")
    }
  }

  return { agregar, isLoading, feedback, error }
}
