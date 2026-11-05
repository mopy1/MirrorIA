import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { ApiError } from "@/lib/api"

/**
 * La pasarela vuelve a /pago/exito y /pago/cancelado con el id de la venta
 * como parámetro (`?venta=...`), agregado por el backend a las URL de
 * éxito/cancelación. sessionStorage queda como respaldo para una
 * configuración vieja sin el parámetro, pero falla si la clienta vuelve en
 * otra pestaña, en otro dispositivo, o si borró datos de navegación —
 * useCheckout lo sigue guardando ahí antes de mandarla a pagar.
 */
const VENTA_ID_STORAGE_KEY = "mirroria_pago_venta_id"

/** Carga la venta con la que volvió la clienta de la pasarela, con reintento manual. */
export function useVentaDeRegreso() {
  const [searchParams] = useSearchParams()
  const [ventaId] = useState(() => searchParams.get("venta") ?? sessionStorage.getItem(VENTA_ID_STORAGE_KEY))
  const [venta, setVenta] = useState<Venta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(ventaId !== null)

  const cargar = useCallback(() => {
    if (!ventaId) return
    checkoutApi
      .getVenta(ventaId)
      .then((v) => {
        setVenta(v)
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo consultar tu compra"))
      .finally(() => setIsLoading(false))
  }, [ventaId])

  useEffect(() => {
    cargar()
  }, [cargar])

  function reintentar() {
    setIsLoading(true)
    cargar()
  }

  return { ventaId, venta, error, isLoading, reintentar }
}
