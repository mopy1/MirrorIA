import type { ItemDiagnosticoAnomalia } from "../types/ml.types"

export interface InfoAnomaliaHumanizada {
  badges: string[]
  descripcion: string
}

/**
 * Traduce diagnósticos técnicos de anomalías POS (Isolation Forest) a lenguaje
 * ejecutivo natural para el Gerente Comercial y Director de Tienda.
 */
export function humanizarAnomalia(diag: ItemDiagnosticoAnomalia): InfoAnomaliaHumanizada {
  if (!diag.es_anomalo || diag.nivel_riesgo === "NORMAL") {
    return {
      badges: [],
      descripcion: "Transacción regular dentro de los parámetros comerciales esperados.",
    }
  }

  const raw = diag.motivo_sospecha ?? ""
  const badges: string[] = []

  const tieneDescuento =
    /descuento/i.test(raw) || Boolean(diag.descuento_cents && diag.descuento_cents > 30000)

  const pctMatch = raw.match(/(\d+)%/)
  const pct = pctMatch ? pctMatch[1] : null

  if (tieneDescuento) {
    badges.push(pct ? `Descuento excesivo (${pct}%)` : "Descuento excesivo")
  }

  const tieneFueraHorario =
    /fuera de horario/i.test(raw) ||
    (typeof diag.hora_venta === "number" && (diag.hora_venta < 6 || diag.hora_venta > 23))

  if (tieneFueraHorario) {
    badges.push("Fuera de horario")
  }

  const tieneMontoAtipico =
    /monto total insignificante|efectivo at[ií]picamente|monto at[ií]pico/i.test(raw) ||
    (diag.metodo_pago?.toUpperCase() === "EFECTIVO" && (diag.monto_total_cents ?? 0) > 250000)

  if (tieneMontoAtipico) {
    badges.push("Monto atípico")
  }

  if (badges.length === 0) {
    badges.push("Sin patrón conocido")
  }

  let descripcion = ""
  if (tieneFueraHorario && tieneDescuento) {
    const detallePct = pct ? `${pct}% de ` : ""
    descripcion = `Venta realizada fuera de horario con ${detallePct}descuento manual aplicado en caja.`
  } else if (tieneDescuento) {
    const detallePct = pct ? ` (${pct}%)` : ""
    descripcion = `Descuento manual inusualmente alto${detallePct} registrado en ticket de venta.`
  } else if (tieneFueraHorario) {
    const horaTxt =
      typeof diag.hora_venta === "number"
        ? ` a las ${String(diag.hora_venta).padStart(2, "0")}:00 hrs`
        : ""
    descripcion = `Venta registrada${horaTxt}, fuera del horario comercial habitual de la tienda.`
  } else if (tieneMontoAtipico) {
    descripcion = "Transacción con importe o volumen de prendas fuera del rango estándar de caja."
  } else {
    descripcion = "Comportamiento atípico detectado en caja que difiere de la operativa habitual."
  }

  return { badges, descripcion }
}
