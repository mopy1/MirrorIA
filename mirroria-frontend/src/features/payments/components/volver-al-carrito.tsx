import { ShoppingBag } from "@phosphor-icons/react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { ApiError } from "@/lib/api"
import { paymentsApi } from "../api/paymentsApi"
import { useRutaTienda } from "@/hooks/useRutaTienda"

/** Cancela una compra PENDIENTE sin pagar y lleva a la clienta a su carrito,
 * que el backend vuelve a llenar con las prendas de esa compra. */
export function VolverAlCarrito({ ventaId, onListo }: { ventaId: string; onListo?: () => void }) {
  const ruta = useRutaTienda()
  const { refresh } = useCart()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function volver() {
    setIsLoading(true)
    setError(null)
    try {
      await paymentsApi.cancelar(ventaId)
      await refresh()
      // Ya en /carrito, navegar no remonta nada: quien lo usa ahí recarga solo.
      onListo?.()
      navigate(ruta("/carrito"))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo volver al carrito")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" onClick={volver} disabled={isLoading}>
        <ShoppingBag data-icon="inline-start" className="size-4" />
        <span>{isLoading ? "Volviendo…" : "Cancelar y volver al carrito"}</span>
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
