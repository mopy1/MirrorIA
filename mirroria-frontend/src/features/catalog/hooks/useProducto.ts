import { useEffect, useState } from "react"
import { catalogApi } from "../api/catalogApi"
import type { Producto } from "../types/catalog.types"

export function useProducto(id: string | undefined) {
  const [producto, setProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    setIsLoading(true)
    catalogApi
      .getProducto(id)
      .then((data) => {
        if (!cancelado) setProducto(data)
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el producto")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  return { producto, isLoading, error }
}
