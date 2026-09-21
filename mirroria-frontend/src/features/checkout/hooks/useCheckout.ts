import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/hooks/useCart"
import { ApiError } from "@/lib/api"
import { paymentsApi } from "@/features/payments/api/paymentsApi"
import type { MetodoPago } from "@/features/payments/types/payments.types"
import { checkoutApi } from "../api/checkoutApi"

export function useCheckout() {
  const { user } = useAuth()
  const { refresh } = useCart()
  const navigate = useNavigate()
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar(metodo: MetodoPago, codigoCupon?: string) {
    if (!user || !sucursalId) return
    setIsLoading(true)
    setError(null)
    try {
      const venta = await checkoutApi.checkout(user.id, sucursalId, codigoCupon)
      await refresh()

      if (metodo === "TARJETA") {
        try {
          const { url } = await paymentsApi.iniciarTarjeta(venta.id)
          window.location.href = url
          return
        } catch (err) {
          // El servidor de la demo puede no tener claves de Stripe (503): es un
          // caso esperado, no un error random. El backend ya redacta el mensaje
          // que explica que se puede pagar por QR o efectivo, así que lo
          // mostramos tal cual y dejamos a la clienta acá, con la venta ya
          // creada — no la mandamos a una pantalla en blanco.
          setError(
            err instanceof ApiError ? err.message : "No se pudo iniciar el pago con tarjeta"
          )
          return
        }
      }

      navigate(`/pago/${venta.id}?metodo=${metodo}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la compra")
    } finally {
      setIsLoading(false)
    }
  }

  return { sucursalId, setSucursalId, confirmar, isLoading, error }
}
