import { useState } from "react"
import { ApiError } from "@/lib/api"

/**
 * Envuelve un submit de creación con loading/error, genérico — mismo motivo
 * de promoción que `useResourceList`: el panel admin repite este patrón para
 * cada recurso (categorías, proveedores, sucursales, productos, etc.).
 */
export function useCreateResource<TDto, TResponse>(createFn: (dto: TDto) => Promise<TResponse>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(dto: TDto): Promise<TResponse | null> {
    setIsLoading(true)
    setError(null)
    try {
      return await createFn(dto)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading, error }
}
