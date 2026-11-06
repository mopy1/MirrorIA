import { apiFetch, ApiError, cabecerasTenant } from "@/lib/api"
import type { ReporteHibridoResponse } from "../types/reports-hybrid.types"
import type { Ficha, Reporte } from "../types/reports.types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"

export interface ExportarReportePayload {
  titulo?: string
  ficha: Ficha
  filas?: Reporte["filas"]
  comparacion?: Reporte["comparacion"]
  narrativa?: string
}

/** Dispara la descarga automática de un Blob en el navegador. */
export function descargarExcel(blob: Blob, nombreArchivo: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const reportsApi = {
  /** CU24: pregunta en lenguaje natural. Devuelve 503 si no hay IA_API_KEY. */
  preguntar: (prompt: string) =>
    apiFetch<Reporte>("/ia/reportes", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  /** Reporte analítico híbrido multi-paso con DuckDB y agente IA. */
  preguntarHibrido: (prompt: string) =>
    apiFetch<ReporteHibridoResponse>("/ia/reportes/hibrido", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  /** Ficha armada a mano. Funciona sin clave de IA. */
  consultar: (ficha: Partial<Ficha>) =>
    apiFetch<Reporte>("/ia/reportes/consulta", {
      method: "POST",
      body: JSON.stringify(ficha),
    }),

  /** Exportar reporte estructurado a Microsoft Excel (.xlsx) */
  exportarExcel: async (payload: ExportarReportePayload): Promise<Blob> => {
    const res = await fetch(`${API_URL}/ia/reportes/exportar-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...cabecerasTenant("auto"),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string | string[] } | null
      const msg = err?.message || "Error al exportar reporte a Excel"
      throw new ApiError(res.status, Array.isArray(msg) ? msg.join(", ") : msg)
    }
    return res.blob()
  },

  descargarExcel,
}
