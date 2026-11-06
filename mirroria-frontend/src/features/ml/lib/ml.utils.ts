import type { ClusterRfmTipo, RiesgoQuiebre } from "../types/ml.types"

/**
 * Calcula la cantidad de reabastecimiento sugerido con un buffer de seguridad (por defecto 20%).
 * Fórmula: max(0, ceil(demanda_30d * (1 + buffer)) - stock_actual)
 */
export function calcularReabastecimientoSugerido(
  demanda30d: number,
  stockActual: number,
  bufferPct = 20,
): number {
  if (demanda30d <= 0) return 0
  const objetivo = Math.ceil(demanda30d * (1 + bufferPct / 100))
  return Math.max(0, objetivo - stockActual)
}

/**
 * Determina el nivel de riesgo de quiebre de stock según días de stock estimados.
 */
export function clasificarRiesgoQuiebre(diasStockEstimados: number): RiesgoQuiebre {
  if (diasStockEstimados <= 3) return "CRITICO"
  if (diasStockEstimados <= 7) return "ALTO"
  if (diasStockEstimados <= 15) return "MEDIO"
  return "BAJO"
}

/**
 * Clasifica la probabilidad de no-show en semáforo de 3 niveles.
 */
export function clasificarRiesgoNoShow(probabilidad: number): {
  nivel: "BAJO" | "MODERADO" | "ALTO"
  color: "VERDE" | "AMARILLO" | "ROJO"
  accion: string
} {
  const p = probabilidad > 1 ? probabilidad / 100 : probabilidad
  if (p < 0.3) {
    return { nivel: "BAJO", color: "VERDE", accion: "No requiere acción" }
  }
  if (p <= 0.6) {
    return { nivel: "MODERADO", color: "AMARILLO", accion: "Monitorear asistencia" }
  }
  return { nivel: "ALTO", color: "ROJO", accion: "Confirmar vía WhatsApp prioritario" }
}

/**
 * Retorna metadatos descriptivos de los clusters RFM.
 */
export function obtenerInfoClusterRfm(segmento: ClusterRfmTipo): {
  nombre: string
  color: string
  prioridad: number
} {
  switch (segmento) {
    case "VIPS_LEALES":
      return { nombre: "VIPs / Leales", color: "#8b5cf6", prioridad: 1 }
    case "POTENCIALES_NUEVAS":
      return { nombre: "Nuevas Promesas", color: "#10b981", prioridad: 2 }
    case "EN_RIESGO_DORMIDAS":
      return { nombre: "En Riesgo / Dormidas", color: "#f59e0b", prioridad: 3 }
    case "OCASIONALES_OUTLET":
      return { nombre: "Ocasionales / Outlet", color: "#64748b", prioridad: 4 }
  }
}

/** Convierte IDs crudos como 'prod_vestido_seda_01' a nombres ejecutivos legibles como 'Vestido Seda'. */
export function formatearNombrePrenda(id: string, nombre?: string): string {
  if (nombre && !nombre.startsWith("prod_")) return nombre
  const limpio = id.replace(/^prod_/, "").replace(/_\d+$/, "").replace(/_/g, " ")
  return limpio.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

/** Convierte IDs de transacción crudos como 'vta_pos_susp_102' a 'Ticket #102'. */
export function formatearNombreTicket(ventaId: string): string {
  const match = ventaId.match(/(\d+)$/)
  return match ? `Ticket #${match[1]}` : `Ticket ${ventaId}`
}

