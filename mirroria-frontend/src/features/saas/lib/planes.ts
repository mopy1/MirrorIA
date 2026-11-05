export { FILAS_LIMITES, formatLimite } from "@/lib/limites-plan"

/** Plan destacado de respaldo si el backend todavía no manda `destacado` (Fase 1b). */
export const PLAN_DESTACADO = "crecimiento"

/** El plan "Más elegido": el que la plataforma marcó como destacado. */
export function esDestacado(plan: { codigo: string; destacado?: boolean }, planes: { destacado?: boolean }[]): boolean {
  const hayMarca = planes.some((p) => p.destacado !== undefined)
  return hayMarca ? Boolean(plan.destacado) : plan.codigo === PLAN_DESTACADO
}

export { formatUsd } from "@/lib/money"

/** Lo que trae cualquier plan (no depende del límite). La personalización va en FILAS_MARCA de la comparativa. */
export const INCLUIDO_EN_TODOS = [
  "Tienda online con tu dirección propia",
  "Vestidor virtual con IA",
  "Cobro por QR, tarjeta y efectivo",
  "Reservas para probarse en sucursal",
  "Reportes en lenguaje natural",
]
