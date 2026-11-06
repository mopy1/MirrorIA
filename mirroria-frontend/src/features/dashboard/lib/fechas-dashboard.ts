import type { PeriodoDashboard, PeriodoResumenDto } from "../types/dashboard.types"

const ZONA = "America/La_Paz"
const fmtCorta = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", timeZone: ZONA })
const fmtLarga = new Intl.DateTimeFormat("es-BO", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA })

/** "2026-11-06" se interpreta como mediodía en La Paz (evita corrimientos de día por zona horaria). */
function aFecha(valor: string | Date): Date {
  if (valor instanceof Date) return valor
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00-04:00`) : new Date(valor)
}

/** "6 nov" (sin punto final que algunos motores agregan a la abreviatura). */
export function fechaCorta(valor: string | Date): string {
  return fmtCorta.format(aFecha(valor)).replace(".", "")
}

/** "viernes 6 de noviembre" */
export function fechaLarga(valor: string | Date): string {
  return fmtLarga.format(aFecha(valor)).replace(",", "")
}

/** Contra qué se compara cada período, en palabras ("los 30 días anteriores"). */
export function periodoDeComparacion(clave: string): string {
  switch (clave as PeriodoDashboard) {
    case "hoy":
      return "ayer"
    case "7d":
      return "los 7 días anteriores"
    case "30d":
      return "los 30 días anteriores"
    case "mes_actual":
      return "el mes pasado"
    case "mes_anterior":
      return "el mes previo"
    default:
      return "la misma cantidad de días justo antes"
  }
}

/** Cómo arranca la frase del resumen según el período ("En los últimos 30 días"). */
export function introPeriodo(periodo: PeriodoResumenDto): string {
  switch (periodo.clave as PeriodoDashboard) {
    case "hoy":
      return "Hoy"
    case "7d":
      return "En los últimos 7 días"
    case "30d":
      return "En los últimos 30 días"
    case "mes_actual":
      return "En lo que va del mes"
    case "mes_anterior":
      return "El mes pasado"
    default:
      return `Del ${fechaCorta(periodo.desde)} al ${fechaCorta(periodo.hasta)}`
  }
}

/** "Del 7 oct al 6 nov · comparado con los 30 días anteriores" */
export function describirRango(periodo: PeriodoResumenDto): string {
  const desde = fechaCorta(periodo.desde)
  const hasta = fechaCorta(periodo.hasta)
  const rango = desde === hasta ? `Hoy, ${hasta}` : `Del ${desde} al ${hasta}`
  return `${rango} · comparado con ${periodoDeComparacion(periodo.clave)}`
}
