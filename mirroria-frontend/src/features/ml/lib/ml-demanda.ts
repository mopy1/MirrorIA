import type { ItemPrediccionDemanda, RiesgoQuiebre } from "../types/ml.types"

const URGENCIA: Record<RiesgoQuiebre, number> = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAJO: 3 }

export function seAgota(item: ItemPrediccionDemanda): boolean {
  return item.riesgo_quiebre === "CRITICO" || item.riesgo_quiebre === "ALTO"
}

/** Lo más urgente primero: por nivel de riesgo y, dentro del mismo nivel, la que dura menos. */
export function ordenarPorUrgencia(items: ItemPrediccionDemanda[]): ItemPrediccionDemanda[] {
  return [...items].sort(
    (a, b) =>
      (URGENCIA[a.riesgo_quiebre] ?? 9) - (URGENCIA[b.riesgo_quiebre] ?? 9) ||
      a.dias_de_stock_estimados - b.dias_de_stock_estimados,
  )
}

/** "Alcanza para ~N días", con los casos borde dichos en palabras. */
export function textoDuracion(item: ItemPrediccionDemanda, horizonteDias: number): string {
  if (item.stock_actual <= 0) return "Ya no tenés stock"
  const dias = item.dias_de_stock_estimados
  if (!Number.isFinite(dias) || dias >= horizonteDias) return `Alcanza para más de ${horizonteDias} días`
  if (dias < 1.5) return "Se termina hoy o mañana"
  return `Alcanza para ~${Math.round(dias)} días`
}

/** "Tenés 4 · se venderían ~15 en 30 días · pedí 11 más". */
export function textoReposicion(item: ItemPrediccionDemanda, horizonteDias: number): string {
  const venta = Math.round(item.demanda_proyectada_unidades)
  const base = `Tenés ${item.stock_actual} · se venderían ~${venta} en ${horizonteDias} días`
  return item.reabastecimiento_sugerido > 0 ? `${base} · pedí ${item.reabastecimiento_sugerido} más` : base
}
