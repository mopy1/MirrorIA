import { useState } from "react"
import { ApiError } from "@/lib/api"
import { avisarMarcaActualizada } from "@/lib/tema/eventos"
import type { MiMarcaDto, SeccionMarca } from "@/types/marca.types"
import { aparienciaApi } from "../api/aparienciaApi"
import type { BorradorMarca } from "../types/apariencia.types"

type Accion = "guardar" | "restablecer"

/** Guardar (PUT) y restablecer (POST). Muestra el `message` real del backend (400 contraste, 403, 409 plan). */
export function useGuardarMarca(onListo: (mi: MiMarcaDto) => void) {
  const [enCurso, setEnCurso] = useState<Accion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardadoOk, setGuardadoOk] = useState(false)

  async function correr(accion: Accion, fn: () => Promise<MiMarcaDto>): Promise<boolean> {
    setEnCurso(accion)
    setError(null)
    setGuardadoOk(false)
    try {
      const mi = await fn()
      onListo(mi)
      avisarMarcaActualizada(mi.efectiva, mi.nombre) // el panel cambia de color y logo al instante
      setGuardadoOk(true)
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la apariencia")
      return false
    } finally {
      setEnCurso(null)
    }
  }

  return {
    enCurso,
    error,
    guardadoOk,
    guardar: (dto: BorradorMarca) => correr("guardar", () => aparienciaApi.guardar(dto)),
    restablecer: (seccion: SeccionMarca) => correr("restablecer", () => aparienciaApi.restablecer(seccion)),
  }
}
