import { apiFetch } from "@/lib/api"
import type { ReporteHibridoResponse } from "../types/reports-hybrid.types"
import type { Ficha, Reporte } from "../types/reports.types"

export const reportsApi = {
  /** CU24: pregunta en lenguaje natural. Devuelve 503 si no hay IA_API_KEY. */
  preguntar: (prompt: string) =>
    apiFetch<Reporte>("/ia/reportes", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  /** Nuevo endpoint: reporte analítico híbrido multi-paso con DuckDB y agente IA. */
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
}
