import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/hooks/useCart"
import { ApiError } from "@/lib/api"

/**
 * "Agregar al carrito" de la ficha. Muestra el mensaje real del backend si
 * falla (p. ej. 409 "Podés llevar hasta 3 unidades de la misma talla y
 * color") en vez de tragarse el error y avisar un éxito falso.
 */
export function useAgregarAlCarrito() {
  const { isAuthenticated } = useAuth()
  const { addItem, isLoading } = useCart()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function agregar(varianteId: string | undefined) {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    if (!varianteId) return
    setFeedback(null)
    setError(null)
    try {
      await addItem(varianteId, 1)
      setFeedback("Se agregó al carrito.")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar al carrito")
    }
  }

  return { agregar, isLoading, feedback, error }
}
