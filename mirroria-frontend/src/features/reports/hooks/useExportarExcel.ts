import { useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"
import type { Reporte } from "../types/reports.types"

/** Nombre de archivo legible a partir del título: "top-5-productos-mas-vendidos_2026-11-06.xlsx". */
export function nombreArchivoExcel(titulo: string, fecha = new Date()): string {
  const slug = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  return `${slug || "reporte"}_${fecha.toISOString().slice(0, 10)}.xlsx`
}

/** Exporta el reporte a Excel con el backend (`POST /ia/reportes/exportar-excel`) y lo descarga. */
export function useExportarExcel(reporte: Reporte, titulo: string) {
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exportar() {
    setExportando(true)
    setError(null)
    try {
      const blob = await reportsApi.exportarExcel({
        ficha: reporte.ficha,
        filas: reporte.filas,
        comparacion: reporte.comparacion,
        titulo,
      })
      reportsApi.descargarExcel(blob, nombreArchivoExcel(titulo))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo generar el Excel. Probá de nuevo en un momento.")
    } finally {
      setExportando(false)
    }
  }

  return { exportar, exportando, error }
}
