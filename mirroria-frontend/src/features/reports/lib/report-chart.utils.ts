import type { Reporte } from "../types/reports.types"

export type TipoGrafico = "line" | "pie" | "bar" | "bar-horizontal"

/**
 * Dimensiones "cerradas" (un enum chico y fijo del negocio, no una lista
 * abierta de entidades): torta/dona tiene sentido acá porque las porciones
 * suman un todo con pocas categorías reales (canal de venta, estado de una
 * reserva/venta...). `producto`/`sucursal`/`proveedor`/`cliente`/`categoria`
 * quedan afuera a propósito — son listas abiertas donde lo que importa es
 * comparar magnitudes/ranking, no ver una proporción de un total cerrado.
 */
const DIMENSIONES_CERRADAS = new Set(["canal", "estado", "tipo_movimiento", "rol"])

/**
 * Elige el tipo de gráfico según la forma del reporte, no una preferencia
 * fija — mismo espíritu que ya tenía el Line-vs-Bar original:
 * 1. `dia`/`mes` (serie temporal) → línea, siempre.
 * 2. Con comparación de períodos → barras agrupadas (dos series por
 *    categoría) — una torta no puede mostrar dos períodos a la vez.
 * 3. Dimensión cerrada con pocas filas → torta/dona (proporción de un todo).
 * 4. Muchas filas → barras horizontales (las etiquetas largas, ej. nombres
 *    de producto, no se pisan como en un eje vertical rotado).
 * 5. Todo lo demás → barras verticales (el default de siempre).
 */
export function elegirTipoGrafico(reporte: Reporte): TipoGrafico {
  const { agruparPor } = reporte.ficha
  if (agruparPor === "dia" || agruparPor === "mes") return "line"
  if (reporte.comparacion) return "bar"
  if (reporte.filas.length <= 4 && DIMENSIONES_CERRADAS.has(agruparPor)) return "pie"
  if (reporte.filas.length > 8) return "bar-horizontal"
  return "bar"
}

export interface FilaGrafico {
  etiqueta: string
  valor: number
  anterior?: number
}

export function datosGrafico(reporte: Reporte): FilaGrafico[] {
  const variaciones = reporte.comparacion?.variaciones
  return reporte.filas.map((fila) => {
    const v = variaciones?.find((x) => x.clave === fila.clave)
    return { etiqueta: fila.etiqueta, valor: fila.valor, ...(v ? { anterior: v.anterior } : {}) }
  })
}

/** `--chart-1`..`--chart-5` ya existen como tokens del tema (ver
 * `index.css`) — se ciclan en vez de inventar colores nuevos por afuera del
 * sistema de diseño. Con más de 5 porciones el color se repite; la torta
 * solo se usa con `filas.length <= 4` (ver `elegirTipoGrafico`), así que en
 * la práctica nunca se repite. */
export function colorPorIndice(i: number): string {
  return `var(--chart-${(i % 5) + 1})`
}
