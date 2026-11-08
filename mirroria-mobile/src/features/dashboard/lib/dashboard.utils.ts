import type { PeriodoDashboard } from "../types/dashboard.types"

/** Formatea montos en Bolivianos con dos decimales y separador de miles. */
export function formatearMontoBs(monto: number): string {
  return `Bs ${monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Monto sin centavos para frases y ejes ("Bs 7.120"); el exacto va en tooltips y listas. */
export function formatearMontoRedondo(monto: number): string {
  return `Bs ${Math.round(monto).toLocaleString("es-BO")}`
}

/** Calcula variación porcentual simétrica protegiendo división por cero. */
export function calcularVariacionPorcentual(actual: number, anterior: number): number {
  if (anterior === 0) {
    return actual > 0 ? 100 : 0
  }
  const delta = ((actual - anterior) / anterior) * 100
  return Number(delta.toFixed(2))
}

/** Determina la interpretación cualitativa de la rotación de stock. */
export function interpretarRotacion(ratio: number): "LENTA" | "SALUDABLE" | "ALTA" {
  if (ratio < 0.3) return "LENTA"
  if (ratio > 2.0) return "ALTA"
  return "SALUDABLE"
}

/** Obtiene el nombre legible de los períodos de tiempo. */
export function obtenerEtiquetaPeriodo(periodo: PeriodoDashboard): string {
  switch (periodo) {
    case "hoy":
      return "Hoy"
    case "7d":
      return "Últimos 7 días"
    case "30d":
      return "Últimos 30 días"
    case "mes_actual":
      return "Mes actual"
    case "mes_anterior":
      return "Mes anterior"
    case "personalizado":
      return "Personalizado"
    default:
      return periodo
  }
}
