import type { Reporte } from "../types/reports.types"
import { esReporteSimulado } from "./report-chart.utils"
import { dimensionDelReporte, esSerieTemporal, metricaDelReporte, nombreMetrica, opcionesPivote } from "./report-metricas"

const GENERICAS = ["¿Qué prendas vendí más este mes?", "¿Cuánto vendí este mes en cada sucursal?", "¿Qué prendas se están quedando sin stock?"]

/**
 * Sugerencias "Seguir preguntando" (2-3, sin repetir la pregunta final de la IA).
 * Son preguntas listas para mandar al asistente, escritas como las haría un gerente.
 */
export function sugerenciasSeguimiento(reporte: Reporte, preguntaFinal: string | null, max = 3): string[] {
  const metrica = metricaDelReporte(reporte)
  const dimension = dimensionDelReporte(reporte)
  const nombre = nombreMetrica(metrica)
  const candidatas: string[] = []

  if (esReporteSimulado(reporte)) {
    candidatas.push("¿Qué pasaría si bajo los precios un 10 %?", "¿Qué prendas vendí más este mes?")
  } else if (metrica) {
    if (metrica === "unidades") candidatas.push("¿Y en ingresos, en vez de unidades?")
    if (metrica === "ingresos") candidatas.push("¿Y en unidades vendidas, en vez de ingresos?")
    if (!reporte.comparacion && !esSerieTemporal(dimension)) {
      candidatas.push(`Comparar ${nombre} de este mes con el mes anterior`)
    }
    const dims = opcionesPivote(metrica).map((o) => o.id)
    if (dimension !== "sucursal" && dims.includes("sucursal")) candidatas.push(`Ver ${nombre} por sucursal`)
    if (!esSerieTemporal(dimension) && dims.includes("dia")) candidatas.push(`Ver cómo evolucionaron ${nombre} día a día`)
  }
  candidatas.push(...GENERICAS)

  const vistas = new Set([preguntaFinal?.trim().toLowerCase()])
  const resultado: string[] = []
  for (const c of candidatas) {
    const clave = c.toLowerCase()
    if (vistas.has(clave)) continue
    vistas.add(clave)
    resultado.push(c)
    if (resultado.length === max) break
  }
  return resultado
}
