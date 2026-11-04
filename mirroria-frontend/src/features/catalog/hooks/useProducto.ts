import { useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { catalogApi } from "../api/catalogApi"
import type { Producto } from "../types/catalog.types"

export function useProducto(id: string | undefined) {
  const [producto, setProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 404 (no existe o está inactivo) y 400 (id mal formado) son "no encontrado", no una falla.
  const [noEncontrado, setNoEncontrado] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    setIsLoading(true)
    catalogApi
      .getProducto(id)
      .then((data) => {
        if (!cancelado) setProducto(data)
      })
      .catch((err) => {
        if (cancelado) return
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setNoEncontrado(true)
        else setError("No se pudo cargar el producto")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  return { producto, isLoading, error, noEncontrado }
}
