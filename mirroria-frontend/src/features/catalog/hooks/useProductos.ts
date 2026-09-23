import { useEffect, useMemo, useState } from "react"
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

  const { categoriaId } = filtro
  const query = filtro.query?.trim().toLowerCase()

  // Memoizado por los valores primitivos del filtro, no por el objeto
  // `filtro` (los llamadores lo arman inline en cada render, así que su
  // identidad nunca sirve como dependencia). Sin este `useMemo`, cualquier
  // pantalla que se re-renderice seguido (el probador virtual, a ~30 fps
  // por la detección de pose) recibía acá un array nuevo en cada cuadro
  // aunque ni los productos ni el filtro hubieran cambiado, lo que rompía
  // cualquier memoización aguas abajo (`useMemo`/`React.memo`) que
  // dependiera de esta lista.
  const filtrados = useMemo(
    () =>
      productos
        .filter((p) => !categoriaId || p.categoriaId === categoriaId)
        .filter((p) => !query || p.titulo.toLowerCase().includes(query)),
    [productos, categoriaId, query],
  )

  return { productos: filtrados, isLoading, error }
}
