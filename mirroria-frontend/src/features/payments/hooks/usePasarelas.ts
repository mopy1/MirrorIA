import { useCallback, useEffect, useState } from "react"
import { pasarelasApi } from "../api/pasarelasApi"
import { estaPasarelaHabilitada } from "../lib/pasarelas.config"
import type { ContextoPasarela, PasarelaMetadata } from "../types/pasarelas.types"

export function usePasarelas(contexto?: ContextoPasarela) {
  const [pasarelas, setPasarelas] = useState<PasarelaMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await pasarelasApi.getPasarelas(contexto)
      setPasarelas(data.filter((p) => estaPasarelaHabilitada(p.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las pasarelas")
    } finally {
      setIsLoading(false)
    }
  }, [contexto])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { pasarelas, isLoading, error, reload: cargar }
}
