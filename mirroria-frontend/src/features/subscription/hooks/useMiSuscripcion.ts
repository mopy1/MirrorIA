import { useCallback, useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { suscripcionApi } from "../api/suscripcionApi"
import type { MiSuscripcionDto } from "../types/suscripcion.types"

/** `GET /saas/mi-suscripcion` (solo ADMIN). `activo=false` no pide nada (otros roles de staff). */
export function useMiSuscripcion(activo = true) {
  const [data, setData] = useState<MiSuscripcionDto | null>(null)
  const [isLoading, setIsLoading] = useState(activo)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    if (!activo) return
    setIsLoading(true)
    setError(null)
    suscripcionApi
      .getMiSuscripcion()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar tu suscripción"))
      .finally(() => setIsLoading(false))
  }, [activo])

  useEffect(cargar, [cargar])

  return { data, setData, isLoading, error, reload: cargar }
}
