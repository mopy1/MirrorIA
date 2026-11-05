import { useState } from "react"
import { ApiError } from "@/lib/api"
import { suscripcionApi } from "../api/suscripcionApi"
import type { MiSuscripcionDto } from "../types/suscripcion.types"

/** `PATCH /saas/mi-suscripcion/plan`: muestra el 409 del backend (no TRIAL, uso > límites). */
export function useCambiarPlan(onCambiado: (nuevo: MiSuscripcionDto) => void) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiar(planCodigo: string): Promise<boolean> {
    setIsLoading(true)
    setError(null)
    try {
      onCambiado(await suscripcionApi.cambiarPlan(planCodigo))
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el plan")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { cambiar, isLoading, error }
}
