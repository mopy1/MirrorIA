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
        if (!cancelado) setCantidadDisponible(filas[0]?.cantidadDisponible ?? 0)
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
