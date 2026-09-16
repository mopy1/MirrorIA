import { useEffect, useState } from "react"
import { checkoutApi } from "../api/checkoutApi"
import type { Venta } from "../types/checkout.types"

export function useVenta(id: string | undefined) {
  const [venta, setVenta] = useState<Venta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    checkoutApi
      .getVenta(id)
      .then((data) => {
        if (!cancelado) setVenta(data)
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  return { venta, isLoading }
}
