import type { Reporte } from "../types/reports.types"
import { datosGrafico, esReporteSimulado, type FilaGrafico } from "./report-chart.utils"
import {
  capitalizar,
  dimensionDelReporte,
  esMetricaAditiva,
  esSerieTemporal,
  metricaDelReporte,
  nombreDimension,
  nombreMetrica,
} from "./report-metricas"
import { formatearPorcentaje, formatearPromedio, formatearValor } from "./report-value.utils"

export type Tendencia = "sube" | "baja" | "igual"

export interface Cifra {
  id: string
  etiqueta: string
  valor: string
  detalle?: string
  tendencia?: Tendencia
  /** El valor es un nombre (prenda, sucursal) y no un número. */
  esTexto?: boolean
}

const sinArticulo = (texto: string) => texto.replace(/^(el|la|los|las)\s+/, "")
const suma = (filas: FilaGrafico[], campo: "valor" | "referencia") => filas.reduce((acc, f) => acc + (Number(f[campo]) || 0), 0)

function tendencia(actual: number, antes: number): Tendencia {
  return actual > antes ? "sube" : actual < antes ? "baja" : "igual"
}

/** "+12 % vs. el período anterior (Bs 1.000,00)" o el aviso honesto cuando antes fue 0. */
export function fraseComparacion(actual: number, anterior: number, metrica: string, contra = "el período anterior"): string {
  if (anterior === 0) return actual === 0 ? `Igual que ${contra}` : `Sin datos en ${contra}`
  const pct = ((actual - anterior) / anterior) * 100
  return `${formatearPorcentaje(pct, true)} vs. ${contra} (${formatearValor(anterior, metrica)})`
}

function cifrasSimulacion(filas: FilaGrafico[], metrica: string): Cifra[] {
  const hoy = suma(filas, "referencia")
  const simulado = suma(filas, "valor")
  return [
    { id: "hoy", etiqueta: "Hoy, con datos reales", valor: formatearValor(hoy, metrica) },
    {
      id: "simulado",
      etiqueta: "Con el escenario simulado",
      valor: formatearValor(simulado, metrica),
      detalle: fraseComparacion(simulado, hoy, metrica, "hoy"),
      tendencia: tendencia(simulado, hoy),
    },
  ]
}

function cifraTotal(reporte: Reporte, filas: FilaGrafico[], metrica: string, etiqueta: string): Cifra {
  const total = suma(filas, "valor")
  const valor = formatearValor(total, metrica)
  if (!reporte.comparacion) return { id: "total", etiqueta, valor }
  const anterior = suma(filas, "referencia")
  return { id: "total", etiqueta, valor, detalle: fraseComparacion(total, anterior, metrica), tendencia: tendencia(total, anterior) }
}

/** Cifras clave del lienzo, derivadas de las filas reales del reporte (lógica pura). */
export function calcularCifras(reporte: Reporte): Cifra[] {
  const filas = datosGrafico(reporte)
  if (filas.length === 0) return []
  const metricaId = metricaDelReporte(reporte)
  const metrica = metricaId ?? ""
  if (esReporteSimulado(reporte)) return cifrasSimulacion(filas, metrica)

  const nombre = capitalizar(sinArticulo(nombreMetrica(metricaId)))
  if (filas.length === 1) return [cifraTotal(reporte, filas, metrica, nombre)]

  const dimension = dimensionDelReporte(reporte)
  const singular = nombreDimension(dimension) ?? "elemento"
  const plural = nombreDimension(dimension, true) ?? "elementos"
  const aditiva = esMetricaAditiva(metricaId)
  const total = suma(filas, "valor")
  const lider = filas.reduce((max, f) => (f.valor > max.valor ? f : max), filas[0])
  const valorLider = formatearValor(lider.valor, metrica)
  const participacion = aditiva && total > 0 ? ` · ${formatearPorcentaje((lider.valor / total) * 100)} del total` : ""

  const cifras: Cifra[] = []
  if (aditiva) cifras.push(cifraTotal(reporte, filas, metrica, `Total de ${sinArticulo(nombreMetrica(metricaId))}`))
  cifras.push({
    id: "lider",
    etiqueta: esSerieTemporal(dimension) ? `El mejor ${singular}` : "En primer lugar",
    valor: lider.etiqueta,
    detalle: `${valorLider}${participacion}`,
    esTexto: true,
  })
  cifras.push({ id: "cantidad", etiqueta: "En el reporte", valor: `${filas.length} ${plural}` })
  cifras.push({ id: "promedio", etiqueta: `Promedio por ${singular}`, valor: formatearPromedio(total / filas.length, metrica) })
  return cifras
}
