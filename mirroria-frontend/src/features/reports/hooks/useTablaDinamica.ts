import { useMemo, useState } from "react"
import { filtrarFilas, ordenarFilas, type ColumnaOrden, type DireccionOrden } from "../lib/tabla-dinamica.utils"
import { dimensionDelReporte } from "../lib/report-metricas"
import type { Reporte } from "../types/reports.types"
import { etiquetaFila } from "../lib/report-etiquetas"

export type { ColumnaOrden, DireccionOrden }

/** Estado de la tabla de "Datos": búsqueda en vivo y orden por columna (la exportación vive en `useExportarExcel`). */
export function useTablaDinamica(reporte: Reporte) {
  const [busqueda, setBusqueda] = useState("")
  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrden>("valor")
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc")

  const filasFiltradas = useMemo(() => {
    const dimension = dimensionDelReporte(reporte)
    return filtrarFilas(reporte.filas, busqueda, (e) => etiquetaFila(e, dimension))
  }, [reporte, busqueda])

  const filas = useMemo(
    () => ordenarFilas(filasFiltradas, columnaOrden, direccionOrden, reporte.comparacion?.variaciones),
    [filasFiltradas, columnaOrden, direccionOrden, reporte.comparacion],
  )

  function conmutarOrden(col: ColumnaOrden) {
    if (columnaOrden === col) {
      setDireccionOrden((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setColumnaOrden(col)
      setDireccionOrden(col === "etiqueta" ? "asc" : "desc")
    }
  }

  return { busqueda, setBusqueda, columnaOrden, direccionOrden, conmutarOrden, filas, totalFilas: reporte.filas.length }
}
