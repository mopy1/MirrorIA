import { useEffect, useState } from "react"
import { catalogApi } from "../api/catalogApi"
import type { Producto } from "../types/catalog.types"

interface UseProductosFiltro {
  categoriaId?: string
  query?: string
}

/**
 * Filtro por categoría y búsqueda por título en el cliente: el backend
 * todavía no expone `GET /catalogo/productos?categoriaId=&q=` — ver
 * mirroria-backend/AGENTS.md. El catálogo de un examen es chico, así que
 * traer todo y filtrar acá es una simplificación real y documentada, no un
 * dato inventado.
 */
export function useProductos(filtro: UseProductosFiltro = {}) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setIsLoading(true)
    catalogApi
      .getProductos()
      .then((data) => {
        if (!cancelado) setProductos(data)
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar los productos")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const query = filtro.query?.trim().toLowerCase()
  const filtrados = productos
    .filter((p) => !filtro.categoriaId || p.categoriaId === filtro.categoriaId)
    .filter((p) => !query || p.titulo.toLowerCase().includes(query))

  return { productos: filtrados, isLoading, error }
}
