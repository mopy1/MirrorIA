import { formatMoney, formatMoneyEntero } from "@/lib/money"

/**
 * Métricas de dinero del catálogo del backend (`catalogo-metricas.ts`,
 * modulo `ia`) — vienen en centavos, igual que `producto.precioCents`. El
 * frontend no importa ese catálogo (vive en otro repo), así que esta lista
 * se mantiene a mano; si el backend agrega una métrica de dinero nueva,
 * agregarla acá también o la tabla/gráfico la va a mostrar como un entero
 * crudo (ej. "3132500" en vez de "Bs 31.325,00").
 */
const METRICAS_MONEDA = new Set(["ingresos", "descuentos", "ticket_promedio", "descuento_por_cupon"])

export function esMetricaMoneda(metrica: string): boolean {
  return METRICAS_MONEDA.has(metrica)
}

/** Para tabla y tooltip — valor exacto. */
export function formatearValor(valor: number, metrica: string): string {
  return esMetricaMoneda(metrica) ? formatMoney(valor) : valor.toLocaleString("es-BO")
}

/** Para el eje de un gráfico — espacio angosto, sin decimales cuando es dinero. */
export function formatearValorEje(valor: number, metrica: string): string {
  return esMetricaMoneda(metrica) ? formatMoneyEntero(valor) : valor.toLocaleString("es-BO")
}
