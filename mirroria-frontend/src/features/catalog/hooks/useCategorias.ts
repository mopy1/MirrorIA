import { useEffect, useState } from "react"
import { catalogApi } from "../api/catalogApi"
import type { Categoria } from "../types/catalog.types"

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    catalogApi
      .getCategorias()
      .then((data) => {
        if (!cancelado) setCategorias(data)
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar las categorías")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return { categorias, isLoading, error }
}
