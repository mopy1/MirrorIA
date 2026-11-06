import type { Reporte } from "../types/reports.types"

/**
 * Qué mostrar en un gráfico del inicio. `ReportChart` no dibuja nada con 0 o 1 fila
 * (no hay nada que comparar), y una tienda con una sola sucursal que vende devuelve
 * exactamente 1 fila en "Ingresos por sucursal": por eso esa tarjeta salía vacía.
 */
export type EstadoGrafico =
  | { tipo: "vacio" }
  | { tipo: "unico"; etiqueta: string; valor: number }
  | { tipo: "grafico" }

export function estadoGrafico(reporte: Reporte): EstadoGrafico {
  const filas = reporte.filas.filter((f) => f.valor !== 0)
  if (filas.length === 0) return { tipo: "vacio" }
  if (filas.length === 1) return { tipo: "unico", etiqueta: filas[0].etiqueta, valor: filas[0].valor }
  return { tipo: "grafico" }
}
