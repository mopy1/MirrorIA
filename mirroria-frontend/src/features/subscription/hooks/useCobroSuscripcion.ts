import { useState } from "react"
import { ApiError } from "@/lib/api"
import { suscripcionApi } from "../api/suscripcionApi"
import type { CobroSuscripcionResponseDto, IniciarCobroSuscripcionDto } from "../types/suscripcion.types"

export function useCobroSuscripcion() {
  const [cobroActual, setCobroActual] = useState<CobroSuscripcionResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function iniciar(dto: IniciarCobroSuscripcionDto) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await suscripcionApi.iniciarCobro(dto)
      if (res.modo === "REDIRECT" && res.url) {
        window.location.href = res.url
        return res
      }
      setCobroActual(res)
      return res
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se pudo iniciar el cobro"
      setError(mensaje)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  function limpiarCobro() {
    setCobroActual(null)
    setError(null)
  }

  return { cobroActual, setCobroActual, iniciar, limpiarCobro, isLoading, error, setError }
}
