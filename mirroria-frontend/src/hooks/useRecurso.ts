import { useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"

/**
 * Fetch de UN recurso (no lista) con loading/error/reload y el `message` del
 * backend. Hermano de `useResourceList`; se vuelve a pedir cuando cambia
 * `clave` (ej. el id o los filtros serializados) o con `reload()`.
 */
export function useRecurso<T>(fetchFn: () => Promise<T>, clave = "") {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const fetchRef = useRef(fetchFn)
  // Siempre la última fetchFn (corre antes que el efecto de abajo: mismo orden de declaración).
  useEffect(() => {
    fetchRef.current = fetchFn
  })

  useEffect(() => {
    let cancelado = false
    setIsLoading(true)
    setError(null)
    fetchRef
      .current()
      .then((d) => !cancelado && setData(d))
      .catch((err) => !cancelado && setError(err instanceof ApiError ? err.message : "No se pudo cargar"))
      .finally(() => !cancelado && setIsLoading(false))
    return () => {
      cancelado = true
    }
  }, [clave, reloadKey])

  return { data, setData, isLoading, error, reload: () => setReloadKey((k) => k + 1) }
}
