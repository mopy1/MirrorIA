import { useEffect, useState } from "react"
import { reportsApi } from "../api/reportsApi"
import { REPORTES_INICIALES, type ReporteInicial } from "../reportes-iniciales.data"
import type { Reporte } from "../types/reports.types"

export type ResultadoInicial = ReporteInicial & {
  reporte: Reporte | null
  cargando: boolean
}

/** Pide los `REPORTES_INICIALES` en paralelo apenas se monta la pantalla.
 * Cada tarjeta guarda su propio estado: si una falla (ej. una métrica sin
 * datos todavía), las demás igual se muestran — no hay un solo `try/catch`
 * que tumbe toda la grilla por una tarjeta. */
export function useReportesIniciales(): ResultadoInicial[] {
  const [resultados, setResultados] = useState<ResultadoInicial[]>(() =>
    REPORTES_INICIALES.map((r) => ({ ...r, reporte: null, cargando: true }))
  )

  useEffect(() => {
    let cancelado = false
    REPORTES_INICIALES.forEach((inicial, index) => {
      reportsApi
        .consultar(inicial.ficha)
        .then((reporte) => {
          if (cancelado) return
          setResultados((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], reporte, cargando: false }
            return next
          })
        })
        .catch(() => {
          if (cancelado) return
          setResultados((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], cargando: false }
            return next
          })
        })
    })
    return () => {
      cancelado = true
    }
  }, [])

  return resultados
}
