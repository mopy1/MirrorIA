import { datosGrafico, elegirFormaGrafico, tituloGrafico } from "../lib/report-chart.utils"
import { metricaDelReporte } from "../lib/report-metricas"
import type { Reporte } from "../types/reports.types"
import { BarrasComparadas } from "./lienzo/barras-comparadas"
import { BarrasRanking } from "./lienzo/barras-ranking"
import { GraficoLinea } from "./lienzo/grafico-linea"
import { WhatIfChart } from "./what-if-chart/what-if-chart"

/**
 * Gráfico del reporte: elige la forma por el trabajo del dato (ver `elegirFormaGrafico`).
 * También lo usa el Resumen de la página con reportes armados sin IA; no requiere más props.
 */
export function ReportChart({ reporte }: { reporte: Reporte }) {
  const forma = elegirFormaGrafico(reporte)
  if (!forma) return null
  const filas = datosGrafico(reporte)
  const metrica = metricaDelReporte(reporte) ?? ""
  const titulo = tituloGrafico(reporte)

  if (forma === "simulacion") return <WhatIfChart filas={filas} metrica={metrica} />
  if (forma === "linea") return <GraficoLinea filas={filas} metrica={metrica} titulo={titulo} />
  if (forma === "comparacion") {
    return (
      <BarrasComparadas filas={filas} metrica={metrica} titulo={titulo} nombreValor="Este período" nombreReferencia="Período anterior" />
    )
  }
  return <BarrasRanking filas={filas} metrica={metrica} titulo={titulo} />
}
