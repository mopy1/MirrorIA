import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/hooks/useCart"
import { ApiError } from "@/lib/api"
import { checkoutApi } from "../api/checkoutApi"

export function useCheckout() {
  const { user } = useAuth()
  const { refresh } = useCart()
  const navigate = useNavigate()
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar(codigoCupon?: string) {
    if (!user || !sucursalId) return
    setIsLoading(true)
    setError(null)
    try {
      const venta = await checkoutApi.checkout(user.id, sucursalId, codigoCupon)
      await refresh()
      navigate(`/checkout/${venta.id}/confirmacion`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la compra")
    } finally {
      setIsLoading(false)
    }
  }

  return { sucursalId, setSucursalId, confirmar, isLoading, error }
}
