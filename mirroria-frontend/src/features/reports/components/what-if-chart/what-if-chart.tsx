import type { FilaGrafico } from "../../lib/report-chart.utils"
import { BarrasComparadas } from "../lienzo/barras-comparadas"

interface WhatIfChartProps {
  filas: FilaGrafico[]
  metrica: string
}

/** Simulación: por cada fila, lo real de hoy contra lo que daría el escenario simulado. */
export function WhatIfChart({ filas, metrica }: WhatIfChartProps) {
  if (filas.length === 0) return null
  return (
    <BarrasComparadas
      filas={filas}
      metrica={metrica}
      titulo="Hoy comparado con el escenario simulado"
      nombreValor="Con el escenario simulado"
      nombreReferencia="Hoy"
    />
  )
}
