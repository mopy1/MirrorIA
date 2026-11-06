/**
 * Etapas que se muestran mientras la IA arma un reporte (el backend responde de una sola vez,
 * así que avanzan por tiempo: es una guía honesta de lo que pasa, no un progreso medido).
 * Las usan el lienzo (`ReporteCargando`) y el chat (indicador "pensando").
 */
export const ETAPAS_REPORTE = ["Entendiendo tu pregunta", "Consultando los datos de tu tienda", "Redactando el análisis"] as const

/** Milisegundos desde que empezó la pregunta → índice de etapa (la última se queda hasta que llega la respuesta). */
export function etapaPorTiempo(ms: number): number {
  if (ms < 1500) return 0
  if (ms < 5000) return 1
  return 2
}
