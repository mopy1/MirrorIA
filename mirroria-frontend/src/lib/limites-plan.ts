import type { LimitesPlanDto, UsoPlanDto } from "@/types/plan.types"

/** `null` = ilimitado (spec §1.1). Los tres recursos son femeninos (sucursales, prendas, cuentas). */
export function formatLimite(valor: number | null, singular: string, plural: string): string {
  if (valor === null) return `${plural.charAt(0).toUpperCase()}${plural.slice(1)} ilimitadas`
  return `${valor} ${valor === 1 ? singular : plural}`
}

/** Recursos con tope por plan, en el mismo orden siempre (bullets, comparativa, medidores). */
export const FILAS_LIMITES: { clave: keyof LimitesPlanDto; uso: keyof UsoPlanDto; singular: string; plural: string }[] = [
  { clave: "maxSucursales", uso: "sucursales", singular: "sucursal", plural: "sucursales" },
  { clave: "maxProductos", uso: "productos", singular: "prenda activa", plural: "prendas activas" },
  { clave: "maxUsuariosStaff", uso: "usuariosStaff", singular: "cuenta de staff", plural: "cuentas de staff" },
]

/** Porcentaje de uso (0-100) o null si es ilimitado. */
export function porcentajeUso(uso: number, limite: number | null): number | null {
  if (limite === null) return null
  if (limite <= 0) return 100
  return Math.min(100, Math.round((uso / limite) * 100))
}
