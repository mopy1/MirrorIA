import type { PasoEjecutado } from "../types/reports-hybrid.types"
import type { Reporte } from "../types/reports.types"
import { nombreDimension, nombreMetrica } from "./report-metricas"
import { formatearPorcentaje } from "./report-value.utils"

export type TipoPaso = "consulta" | "proveedores" | "simulacion" | "otro"

export interface PasoHumano {
  id: number
  tipo: TipoPaso
  titulo: string
  detalle: string | null
}

/** "1 paso" / "3 pasos" — y lo mismo para cualquier sustantivo regular. */
export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return `${n.toLocaleString("es-BO")} ${n === 1 ? singular : pluralForma}`
}

const primerNumero = (texto: string) => {
  const m = /(\d+)/.exec(texto)
  return m ? Number(m[1]) : null
}

const fechaCorta = (iso: unknown) => {
  const m = typeof iso === "string" ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null
}

/** Variación porcentual de una palanca: "+10 %" o "sin cambios". */
function palanca(valor: unknown): string {
  const n = Number(valor) || 0
  return n === 0 ? "sin cambios" : formatearPorcentaje(n, true)
}

export function describirEscenario(argumentos: Record<string, unknown>): string {
  return `Precio ${palanca(argumentos.variacionPrecioPct)} y cantidad vendida ${palanca(argumentos.variacionVolumenPct)}`
}

/** Traduce un paso del agente IA a lenguaje de gerente (sin nombres de herramientas ni motores). */
export function describirPaso(paso: PasoEjecutado): PasoHumano {
  const args = paso.argumentos ?? {}
  const n = primerNumero(paso.resultadoResumen ?? "")
  if (paso.herramienta === "consultar_metricas") {
    const metrica = typeof args.metrica === "string" ? (args.metrica === "ventas_totales" ? "ingresos" : args.metrica) : null
    const dim = nombreDimension(typeof args.dimension === "string" ? args.dimension : null)
    const desde = fechaCorta(args.fechaInicio)
    const hasta = fechaCorta(args.fechaFin)
    const periodo = desde && hasta ? ` del ${desde} al ${hasta}` : desde ? ` desde el ${desde}` : ""
    return {
      id: paso.paso,
      tipo: "consulta",
      titulo: `Consultó ${nombreMetrica(metrica)}${dim ? ` por ${dim}` : ""}${periodo}`,
      detalle: n === null ? null : `Encontró ${plural(n, "resultado")}`,
    }
  }
  if (paso.herramienta === "consultar_proveedores_stock") {
    return {
      id: paso.paso,
      tipo: "proveedores",
      titulo: "Revisó las órdenes de compra a proveedores",
      detalle: n === null ? null : `Revisó ${plural(n, "orden", "órdenes")}`,
    }
  }
  if (paso.herramienta === "simular_what_if") {
    return {
      id: paso.paso,
      tipo: "simulacion",
      titulo: `Simuló un escenario: ${describirEscenario(args).toLowerCase()}`,
      detalle: n === null ? null : `Proyectó ${plural(n, "resultado")}`,
    }
  }
  return { id: paso.paso, tipo: "otro", titulo: "Hizo un cálculo adicional sobre tus datos", detalle: null }
}

/** El escenario simulado del reporte, si lo hay, dicho en humano. */
export function escenarioDelReporte(reporte: Reporte): string | null {
  const sim = reporte.pasosEjecutados?.find((p) => p.herramienta === "simular_what_if")
  return sim ? describirEscenario(sim.argumentos ?? {}) : null
}
