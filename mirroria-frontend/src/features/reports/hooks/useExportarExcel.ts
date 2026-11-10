import { useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"
import { fichaExportable } from "../lib/ficha-exportable"
import { nombreArchivoReporte, type FormatoReporte } from "../lib/formato-pedido"
import type { Reporte } from "../types/reports.types"

export function nombreArchivoExcel(titulo: string, fecha = new Date()): string {
  return nombreArchivoReporte(titulo, "excel", fecha)
}

/** Una simulación o una consulta de proveedores no tiene ficha del motor: el backend no la puede recalcular. */
export class ReporteNoExportableError extends Error {
  constructor() {
    super("Este reporte no se puede exportar porque es una simulación. Pedí el dato real (por ejemplo, «ingresos por mes») y exportá ese.")
  }
}

/** Pide el archivo al backend y lo descarga. */
export async function descargarReporte(reporte: Reporte, titulo: string, formato: FormatoReporte): Promise<void> {
  const ficha = fichaExportable(reporte)
  if (!ficha) throw new ReporteNoExportableError()
  const payload = { ficha, filas: reporte.filas, comparacion: reporte.comparacion, titulo }
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
      const conMensaje = e instanceof ApiError || e instanceof ReporteNoExportableError
      setError(conMensaje ? e.message : "No se pudo generar el archivo. Probá de nuevo en un momento.")
    } finally {
      setExportando(null)
    }
  }

  return { exportar, exportando, error }
}
