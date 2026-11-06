import { capitalizar } from "./report-metricas"

/** Valores crudos del backend (estados, canales) dichos en palabras. */
const ESTADOS: Record<string, string> = {
  NO_SHOW: "No asistió",
  EN_TIENDA: "Llegó a la tienda",
  PRESENCIAL: "En tienda",
  WEB: "Tienda online",
  MOVIL: "App móvil",
  DEVUELTA_PARCIAL: "Devuelta en parte",
  DEVUELTA_TOTAL: "Devuelta",
  RECIBIDA_PARCIAL: "Recibida en parte",
  EN_TRANSITO: "En camino",
  RECEPCION_PROVEEDOR: "Llegada de proveedor",
  LIBERACION_RESERVA: "Reserva liberada",
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** Etiqueta de fila legible: fechas ISO del backend y estados en MAYÚSCULAS → palabras. */
export function etiquetaFila(etiqueta: string, dimension: string | null): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(etiqueta)
  if (dia) return `${Number(dia[3])} ${MESES[Number(dia[2]) - 1]}`
  const mes = /^(\d{4})-(\d{2})$/.exec(etiqueta)
  if (mes) return `${capitalizar(MESES[Number(mes[2]) - 1])} ${mes[1]}`
  if (ESTADOS[etiqueta]) return ESTADOS[etiqueta]
  if (dimension !== "cupon" && /^[A-Z][A-Z_]+$/.test(etiqueta)) return capitalizar(etiqueta.toLowerCase().replace(/_/g, " "))
  return etiqueta
}
