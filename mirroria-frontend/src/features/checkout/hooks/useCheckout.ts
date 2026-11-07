import { useState } from "react"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useCart } from "@/hooks/useCart"
import { useTienda } from "@/hooks/useTienda"
import { ApiError } from "@/lib/api"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { encolarCheckout } from "@/lib/offline/operaciones-clienta"
import { hayRed } from "@/lib/offline/red-simulada"
import { useIrAPagar } from "@/features/payments/hooks/useIrAPagar"
import type { MetodoPago } from "@/features/payments/types/payments.types"
import { checkoutApi } from "../api/checkoutApi"

/**
 * Confirmar el carrito. Con red: crea la venta PENDIENTE y lleva a pagar.
 * Sin red: encola la ORDEN (CHECKOUT, con su Idempotency-Key) y la muestra
 * "Pendiente de confirmar"; el pago se ofrece cuando el servidor la confirme (RN08).
 */
export function useCheckout() {
  const user = useSesionEnTienda()
  const { slug } = useTienda()
  const { refresh } = useCart()
  const irAPagar = useIrAPagar()
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [encolada, setEncolada] = useState<OperacionOutbox | null>(null)

  async function confirmar(metodo: MetodoPago, codigoCupon?: string, descripcion = "Compra del carrito") {
    if (!user || !sucursalId) return
    setIsLoading(true)
    setError(null)
    try {
      if (!hayRed() && slug) {
        setEncolada(await encolarCheckout({ tenantId: slug, usuarioId: user.id, sucursalId, codigoCupon, metodoPago: metodo, descripcion }))
        return
      }
      const venta = await checkoutApi.checkout(user.id, sucursalId, codigoCupon)
      await refresh()
      await irAPagar(venta.id, metodo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la compra")
    } finally {
      setIsLoading(false)
    }
  }

  return { sucursalId, setSucursalId, confirmar, isLoading, error, encolada }
}
