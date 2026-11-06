import type { Reporte } from "../types/reports.types"
import {
  capitalizar,
  dimensionDelReporte,
  esSerieTemporal,
  metricaDelReporte,
  nombreDimension,
  nombreMetrica,
} from "./report-metricas"
import { etiquetaFila } from "./report-etiquetas"

/**
 * Forma del gráfico según el trabajo del dato (skill dataviz):
 * - `linea`: serie de tiempo (día/mes) → cambio en el tiempo.
 * - `simulacion`: escenario proyectado → hoy vs. simulado por fila.
 * - `comparacion`: períodos comparados → actual vs. anterior por fila.
 * - `barras`: ranking/categorías → barras horizontales con nombre completo y valor al final
 *   (nunca un eje vertical que saltea etiquetas, ni torta: comparar largos se lee mejor que ángulos).
 * - `null`: sin filas, no hay gráfico.
 */
export type FormaGrafico = "linea" | "simulacion" | "comparacion" | "barras"

export function esReporteSimulado(reporte: Reporte): boolean {
  return (
    reporte.tipoGraficoSugerido === "what-if-comparison" ||
    Boolean(reporte.esSimulacion) ||
    reporte.filas.some((f) => f.valorProyectado !== undefined || f.detalles?.original !== undefined)
  )
}

export function elegirFormaGrafico(reporte: Reporte): FormaGrafico | null {
  if (reporte.filas.length === 0) return null
  if (esReporteSimulado(reporte)) return "simulacion"
  if (esSerieTemporal(dimensionDelReporte(reporte)) && reporte.filas.length > 1) return "linea"
  if (reporte.comparacion) return "comparacion"
  return "barras"
}

export interface FilaGrafico {
  clave: string
  etiqueta: string
  valor: number
  /** Valor contra el que se compara (período anterior o "hoy" en una simulación). */
  referencia?: number
}

/** Filas listas para dibujar, con etiquetas humanas y la referencia según la forma. */
export function datosGrafico(reporte: Reporte): FilaGrafico[] {
  const dimension = dimensionDelReporte(reporte)
  const variaciones = reporte.comparacion?.variaciones
  return reporte.filas.map((fila) => {
    const base = { clave: fila.clave, etiqueta: etiquetaFila(fila.etiqueta, dimension), valor: fila.valor }
    if (esReporteSimulado(reporte)) {
      const original = fila.detalles?.original
      const real = original !== undefined ? Number(original) : (fila.valorOriginal ?? fila.valor)
      return { ...base, valor: fila.valorProyectado ?? fila.valor, referencia: real }
    }
    const v = variaciones?.find((x) => x.clave === fila.clave)
    return v ? { ...base, referencia: v.anterior } : base
  })
}


/** "Unidades vendidas por prenda": qué muestra el gráfico, dicho en humano. */
export function tituloGrafico(reporte: Reporte): string {
  if (esReporteSimulado(reporte)) return "Hoy comparado con el escenario simulado"
  const metrica = capitalizar(nombreMetrica(metricaDelReporte(reporte)).replace(/^(el|la|los|las)\s+/, ""))
  const dim = nombreDimension(dimensionDelReporte(reporte))
  return dim ? `${metrica} por ${dim}` : metrica
}
