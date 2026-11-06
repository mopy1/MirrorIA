import type { Reporte } from "./reports.types"

/** Tono del mensaje del asistente — decide cómo se pinta la burbuja.
 * `normal`: reporte listo o respuesta conversacional (ej. "qué podés hacer").
 * `aclaracion`: 422 de `ConsultaNoComprendidaException` — la pregunta no es de
 * negocio; es conversación, no una falla. `error`: falla real (red, 503, 504…). */
export type TonoMensaje = "normal" | "aclaracion" | "error"

export interface ChatMessage {
  id: string
  rol: "usuario" | "asistente"
  /** Texto corto (markdown permitido). Para un reporte: solo la conclusión, nunca el análisis completo. */
  texto: string
  tono?: TonoMensaje
  /** Si el mensaje generó un reporte, la pestaña donde vive (para "Ver reporte"). */
  reporteTabId?: string
  reporteTitulo?: string
  /** Pregunta que originó el mensaje: para "Reintentar" o regenerar si la pestaña ya se cerró. */
  pregunta?: string
  /** Solo en errores: si tiene sentido ofrecer "Reintentar". */
  reintentable?: boolean
  /** En aclaraciones: preguntas de ejemplo clicables. */
  sugerencias?: string[]
}

export type TabResumen = { id: "resumen"; tipo: "resumen"; titulo: "Resumen" }

export interface TabReporte {
  id: string
  tipo: "reporte"
  /** Título completo (la tira lo trunca con CSS y lo muestra entero en el tooltip). */
  titulo: string
  /** Pregunta original en lenguaje natural; no existe en reportes del constructor sin IA. */
  pregunta?: string
  reporte: Reporte | null
  cargando: boolean
  /** `Date.now()` del último intento: guía las etapas de "pensando". */
  iniciadoEn: number
  generadoEn?: Date
  error?: string
  reintentable?: boolean
}

export type ReportTab = TabResumen | TabReporte
