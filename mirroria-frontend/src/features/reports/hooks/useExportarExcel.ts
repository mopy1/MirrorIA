import { useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"
import { nombreArchivoReporte, type FormatoReporte } from "../lib/formato-pedido"
import type { Reporte } from "../types/reports.types"

export function nombreArchivoExcel(titulo: string, fecha = new Date()): string {
  return nombreArchivoReporte(titulo, "excel", fecha)
}

/** Pide el archivo al backend y lo descarga. */
export async function descargarReporte(reporte: Reporte, titulo: string, formato: FormatoReporte): Promise<void> {
  const payload = { ficha: reporte.ficha, filas: reporte.filas, comparacion: reporte.comparacion, titulo }
  const blob = await (formato === "pdf" ? reportsApi.exportarPdf(payload) : reportsApi.exportarExcel(payload))
  reportsApi.descargarExcel(blob, nombreArchivoReporte(titulo, formato))
}

/** Exporta el reporte a Excel o PDF con el backend y lo descarga. */
export function useExportarExcel(reporte: Reporte, titulo: string) {
  const [exportando, setExportando] = useState<FormatoReporte | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportar(formato: FormatoReporte = "excel") {
    setExportando(formato)
    setError(null)
    try {
      await descargarReporte(reporte, titulo, formato)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo generar el archivo. Probá de nuevo en un momento.")
    } finally {
      setExportando(null)
    }
  }

  return { exportar, exportando, error }
}
