import type { Reporte } from "./reports.types"

/** Tono del mensaje del asistente — decide cómo se pinta la burbuja.
 * `normal`: reporte creado o respuesta conversacional (ej. "qué podés hacer").
 * `aclaracion`: 422 de `ConsultaNoComprendidaException` — el asistente
 * entendió pero no es una pregunta de negocio (ver ReportesAdminPage.tsx,
 * Fase 1). `error`: falla real (red, 503 sin IA_API_KEY, etc.). */
export type TonoMensaje = "normal" | "aclaracion" | "error"

export interface ChatMessage {
  id: string
  rol: "usuario" | "asistente"
  texto: string
  tono?: TonoMensaje
  /** Si el mensaje generó un reporte nuevo, el id del tab para poder abrirlo
   * desde la burbuja sin tener que ir a buscarlo en la barra de tabs. */
  reporteTabId?: string
}

export type ReportTab =
  | { id: "resumen"; tipo: "resumen"; titulo: "Resumen" }
  | {
      id: string
      tipo: "reporte"
      titulo: string
      reporte: Reporte | null
      cargando: boolean
    }
