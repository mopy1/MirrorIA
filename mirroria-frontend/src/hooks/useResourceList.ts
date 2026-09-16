import { useEffect, useState } from "react"

/**
 * Fetch-on-mount + recargar bajo demanda, genérico. Se promovió acá (no vive
 * en `features/admin/`) porque el panel admin repite este mismo patrón de
 * "listar un recurso" para 9+ recursos distintos (categorías, proveedores,
 * sucursales, ventas, etc.) — es una utilidad técnica agnóstica del dominio,
 * mismo criterio de promoción que useAuth/useCart (Sección 1.E de AGENTS.md).
 */
export function useResourceList<T>(fetchFn: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelado = false
    setIsLoading(true)
    setError(null)
    fetchFn()
      .then((data) => {
        if (!cancelado) setItems(data)
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar la lista")
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [reloadKey])

  return { items, isLoading, error, reload: () => setReloadKey((k) => k + 1) }
}
