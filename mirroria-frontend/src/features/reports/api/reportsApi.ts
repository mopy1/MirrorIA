import { apiFetch } from "@/lib/api"
import type { Ficha, Interaccion, Reporte } from "../types/reports.types"

export const reportsApi = {
  /** CU24: pregunta en lenguaje natural. Devuelve 503 si no hay IA_API_KEY. */
  preguntar: (prompt: string) =>
    apiFetch<Reporte>("/ia/reportes", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  /** Ficha armada a mano. Funciona sin clave de IA. */
  consultar: (ficha: Partial<Ficha>) =>
    apiFetch<Reporte>("/ia/reportes/consulta", {
      method: "POST",
      body: JSON.stringify(ficha),
    }),

  historial: () => apiFetch<Interaccion[]>("/ia/interacciones"),
}
