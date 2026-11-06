import { useMemo, useState } from "react"
import { reportsApi } from "../api/reportsApi"
import {
  filtrarFilas,
  ordenarFilas,
  type ColumnaOrden,
  type DireccionOrden,
} from "../lib/tabla-dinamica.utils"
import type { Reporte } from "../types/reports.types"

export type { ColumnaOrden, DireccionOrden }

export function useTablaDinamica(reporte: Reporte, onPivoteChange?: (dimension: string) => void) {
  const [busqueda, setBusqueda] = useState("")
  const [columnaOrden, setColumnaOrden] = useState<ColumnaOrden>("valor")
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc")
  const [exportando, setExportando] = useState(false)

  const filasFiltradas = useMemo(
    () => filtrarFilas(reporte.filas, busqueda),
    [reporte.filas, busqueda]
  )

  const filasOrdenadas = useMemo(
    () => ordenarFilas(filasFiltradas, columnaOrden, direccionOrden, reporte.comparacion?.variaciones),
    [filasFiltradas, columnaOrden, direccionOrden, reporte.comparacion]
  )

  function conmutarOrden(col: ColumnaOrden) {
    if (columnaOrden === col) {
      setDireccionOrden((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setColumnaOrden(col)
      setDireccionOrden("desc")
    }
  }

  async function descargarExcel() {
    try {
      setExportando(true)
      const fecha = new Date().toISOString().slice(0, 10)
      const blob = await reportsApi.exportarExcel({
        ficha: reporte.ficha,
        filas: reporte.filas,
        comparacion: reporte.comparacion,
        titulo: `Reporte de ${reporte.ficha.metrica} por ${reporte.ficha.agruparPor}`,
      })
      reportsApi.descargarExcel(blob, `reporte_${reporte.ficha.metrica}_${fecha}.xlsx`)
    } finally {
      setExportando(false)
    }
  }

  return {
    busqueda,
    setBusqueda,
    columnaOrden,
    direccionOrden,
    conmutarOrden,
    filas: filasOrdenadas,
    totalFilas: reporte.filas.length,
    exportando,
    descargarExcel,
    repivotear: onPivoteChange,
  }
}
