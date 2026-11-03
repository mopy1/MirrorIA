import { useEffect, useState } from "react"
import { inventoryApi } from "../api/inventoryApi"

export function useDisponibilidad(varianteId: string | undefined, sucursalId: string | undefined) {
  const [cantidadDisponible, setCantidadDisponible] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!varianteId || !sucursalId) {
      setCantidadDisponible(null)
      return
    }
    let cancelado = false
    setIsLoading(true)
    inventoryApi
      .getDisponibilidad({ varianteId, sucursalId })
      .then((filas) => {
        // Lo libre para comprar: lo reservado por otras clientas no se vende.
        const fila = filas[0]
        if (!cancelado)
          setCantidadDisponible(
            fila ? Math.max(0, fila.cantidadDisponible - (fila.cantidadReservada ?? 0)) : 0
          )
      })
      .catch(() => {
        if (!cancelado) setCantidadDisponible(null)
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [varianteId, sucursalId])

  return { cantidadDisponible, isLoading }
}
