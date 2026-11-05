import { useState } from "react"
import { ApiError } from "@/lib/api"
import { plataformaApi } from "../api/plataformaApi"
import type { EstadoInquilino, InquilinoDetalleDto, SeccionMarca } from "../types/plataforma.types"

type Accion = "estado" | "plan" | "extender" | "marca"

/** Suspender/reactivar, cambiar plan, extender vigencia y restablecer marca (CU40). Cada diálogo ve su propio loading/error. */
export function useAccionesInquilino(id: string, onActualizado: (d: InquilinoDetalleDto) => void) {
  const [enCurso, setEnCurso] = useState<Accion | null>(null)
  const [error, setError] = useState<{ accion: Accion; mensaje: string } | null>(null)

  async function correr(accion: Accion, fn: () => Promise<InquilinoDetalleDto>): Promise<boolean> {
    setEnCurso(accion)
    setError(null)
    try {
      onActualizado(await fn())
      return true
    } catch (err) {
      setError({ accion, mensaje: err instanceof ApiError ? err.message : "No se pudo completar la acción" })
      return false
    } finally {
      setEnCurso(null)
    }
  }

  return {
    enCurso,
    errorDe: (accion: Accion) => (error?.accion === accion ? error.mensaje : null),
    limpiar: () => setError(null),
    cambiarEstado: (estado: EstadoInquilino, motivo?: string) => correr("estado", () => plataformaApi.cambiarEstado(id, estado, motivo)),
    cambiarPlan: (planCodigo: string) => correr("plan", () => plataformaApi.cambiarPlan(id, planCodigo)),
    extender: (dias: number) => correr("extender", () => plataformaApi.extender(id, dias)),
    restablecerMarca: (seccion: SeccionMarca, motivo: string) =>
      correr("marca", () => plataformaApi.restablecerMarca(id, seccion, motivo)),
  }
}
