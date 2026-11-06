import type { DistribucionPagoDto } from "../types/dashboard.types"

export interface MetodoPagoResumen {
  clave: string
  nombre: string
  montoBs: number
  porcentaje: number
  transacciones: number
  /** Color fijo por método (no por posición): Efectivo siempre es el mismo color. */
  color: string
}

/** Orden y colores fijos (paleta categórica validada: slots 1-3 pasan todas las parejas). */
const METODOS: Record<string, { nombre: string; color: string; orden: number }> = {
  EFECTIVO: { nombre: "Efectivo", color: "#2a78d6", orden: 0 },
  TARJETA: { nombre: "Tarjeta", color: "#eb6834", orden: 1 },
  QR: { nombre: "QR", color: "#1baf7a", orden: 2 },
}
const OTRO = { nombre: "Otro medio", color: "#8a8985", orden: 9 }

/** Nombre humano del método de cobro (nunca "MANUAL", "STRIPE" o "WAYRA"). */
export function nombreMetodoPago(metodo: string, proveedor?: string): string {
  const clave = claveMetodo(metodo, proveedor)
  return (METODOS[clave] ?? OTRO).nombre
}

function claveMetodo(metodo: string, proveedor?: string): string {
  const m = (metodo ?? "").toUpperCase()
  if (METODOS[m]) return m
  const p = (proveedor ?? "").toUpperCase()
  if (p === "STRIPE") return "TARJETA"
  if (p === "WAYRA") return "QR"
  if (p === "MANUAL") return "EFECTIVO"
  return "OTRO"
}

/** Agrupa por método humano (varias pasarelas pueden cobrar con tarjeta) y recalcula el porcentaje. */
export function agruparPagosPorMetodo(pagos: DistribucionPagoDto[]): MetodoPagoResumen[] {
  const grupos = new Map<string, MetodoPagoResumen>()
  for (const p of pagos) {
    const clave = claveMetodo(p.metodo, p.proveedor)
    const base = METODOS[clave] ?? OTRO
    const g = grupos.get(clave) ?? { clave, nombre: base.nombre, color: base.color, montoBs: 0, porcentaje: 0, transacciones: 0 }
    g.montoBs += p.montoBs
    g.transacciones += p.transacciones
    grupos.set(clave, g)
  }
  const total = [...grupos.values()].reduce((acc, g) => acc + g.montoBs, 0)
  return [...grupos.values()]
    .map((g) => ({ ...g, porcentaje: total > 0 ? Math.round((g.montoBs / total) * 100) : 0 }))
    .sort((a, b) => (METODOS[a.clave] ?? OTRO).orden - (METODOS[b.clave] ?? OTRO).orden)
}
