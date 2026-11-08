import type { ItemDiagnosticoAnomalia } from "../types/ml.types"
import { formatearHora } from "./ml-lenguaje"

export interface VentaHumanizada {
  inusual: boolean
  estado: "Normal" | "Inusual, revisar"
  /** Motivos cortos en palabras ("97% de descuento", "Fuera de horario (03:00)"). */
  motivos: string[]
}

function porcentajeDescuento(diag: ItemDiagnosticoAnomalia, raw: string): number | null {
  const enTexto = raw.match(/(\d+)%/)
  if (enTexto) return Number(enTexto[1])
  const desc = diag.descuento_cents ?? 0
  const total = (diag.monto_total_cents ?? 0) + desc
  return desc > 0 && total > 0 ? Math.round((desc / total) * 100) : null
}

/**
 * Traduce el diagnóstico del detector de ventas raras a lenguaje de tienda:
 * "Normal" o "Inusual, revisar" + los motivos en palabras. Sin puntajes ni jerga.
 */
export function humanizarAnomalia(diag: ItemDiagnosticoAnomalia): VentaHumanizada {
  if (!diag.es_anomalo || diag.nivel_riesgo === "NORMAL") {
    return { inusual: false, estado: "Normal", motivos: [] }
  }

  const raw = diag.motivo_sospecha ?? ""
  const motivos: string[] = []

  if (/descuento/i.test(raw) || (diag.descuento_cents ?? 0) > 30000) {
    const pct = porcentajeDescuento(diag, raw)
    motivos.push(pct ? `${pct}% de descuento` : "Descuento muy alto")
  }

  const fueraDeHorario =
    /fuera de horario/i.test(raw) ||
    (typeof diag.hora_venta === "number" && (diag.hora_venta < 6 || diag.hora_venta > 23))
  if (fueraDeHorario) {
    const hora = formatearHora(diag.hora_venta)
    motivos.push(hora ? `Fuera de horario (${hora})` : "Fuera de horario")
  }

  const prendas = raw.match(/para (\d+) prendas/i)
  if (/insignificante/i.test(raw)) {
    motivos.push(prendas ? `Monto muy bajo para ${prendas[1]} prendas` : "Monto muy bajo para lo que se llevó")
  }

  if (/efectivo at[ií]picamente/i.test(raw) ||
    (diag.metodo_pago?.toUpperCase() === "EFECTIVO" && (diag.monto_total_cents ?? 0) > 250000)) {
    motivos.push("Mucho dinero en efectivo")
  }

  if (motivos.length === 0) motivos.push("No se parece a tus ventas de siempre")

  return { inusual: true, estado: "Inusual, revisar", motivos }
}
