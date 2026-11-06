import type { RiesgoQuiebre } from "../types/ml.types"

/** Tono semántico de un estado. Siempre se muestra con ícono + palabra, nunca solo color. */
export type Tono = "bien" | "atencion" | "alerta" | "critico"

/** "1 prenda" / "3 prendas". */
export function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

/** El backend a veces manda la probabilidad en 0-1 y a veces en 0-100. */
export function normalizarProbabilidad(p: number): number {
  return p > 1 ? p / 100 : p
}

const ESTADO_STOCK: Record<RiesgoQuiebre, { etiqueta: string; tono: Tono }> = {
  BAJO: { etiqueta: "Sin riesgo", tono: "bien" },
  MEDIO: { etiqueta: "Atento", tono: "atencion" },
  ALTO: { etiqueta: "Se agota pronto", tono: "alerta" },
  CRITICO: { etiqueta: "Se agota ya", tono: "critico" },
}

export function estadoStock(riesgo: RiesgoQuiebre): { etiqueta: string; tono: Tono } {
  return ESTADO_STOCK[riesgo] ?? ESTADO_STOCK.BAJO
}

/** "¿Vendrá?" en palabras. Mismos cortes que usa el servicio de predicción (35% y 65%). */
export function vendraCita(probabilidad: number): { etiqueta: string; tono: Tono; enRiesgo: boolean } {
  const p = normalizarProbabilidad(probabilidad)
  if (p >= 0.65) return { etiqueta: "Probable que falte", tono: "critico", enRiesgo: true }
  if (p >= 0.35) return { etiqueta: "Puede faltar", tono: "atencion", enRiesgo: true }
  return { etiqueta: "Seguro", tono: "bien", enRiesgo: false }
}

const FACTORES: { patron: RegExp; texto: (m: RegExpMatchArray) => string }[] = [
  { patron: /con (\d+) días de anticipación/i, texto: (m) => `Reservó con ${m[1]} días de anticipación` },
  { patron: /alta anticipación/i, texto: () => "Reservó con mucha anticipación" },
  { patron: /sin historial previo/i, texto: () => "Es su primera reserva" },
  { patron: /\((\d+) prendas\)/i, texto: (m) => `Apartó ${m[1]} prendas` },
  { patron: /día de semana/i, texto: () => "La cita es en día de semana" },
  { patron: /asistencia bajo/i, texto: () => "Faltó a varias citas antes" },
  { patron: /confiable|asistencia regular/i, texto: () => "Suele venir a sus citas" },
]

/** Traduce un factor del modelo a una frase corta, sin porcentajes de peso. */
export function humanizarFactor(factor: string): string {
  for (const { patron, texto } of FACTORES) {
    const m = factor.match(patron)
    if (m) return texto(m)
  }
  return factor.replace(/\s*\([+-]?\d+(?:[.,]\d+)?%\)/g, "").trim()
}

/** Qué hacer con una cita, según la acción que sugiere el modelo. */
export function accionCita(codigo: string, probabilidad: number): string {
  if (codigo === "CONFIRMAR_WHATSAPP_PRIORITARIO") return "Escribile hoy por WhatsApp para confirmar"
  if (codigo === "MONITOREAR") return "Si no llega a la hora, llamala"
  if (codigo === "ASISTIRA_NORMAL") return "No hace falta hacer nada"
  const { tono } = vendraCita(probabilidad)
  if (tono === "critico") return "Escribile hoy por WhatsApp para confirmar"
  return tono === "atencion" ? "Si no llega a la hora, llamala" : "No hace falta hacer nada"
}

const METODOS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  QR: "QR",
  WAYRA_QR: "QR",
  TRANSFERENCIA: "Transferencia",
}

export function metodoPagoHumano(metodo?: string): string | null {
  if (!metodo) return null
  const clave = metodo.toUpperCase()
  if (METODOS[clave]) return METODOS[clave]
  if (clave.includes("QR")) return "QR"
  return clave.charAt(0) + clave.slice(1).toLowerCase().replace(/_/g, " ")
}

export function formatearHora(hora?: number): string | null {
  return typeof hora === "number" ? `${String(hora).padStart(2, "0")}:00` : null
}

/** Quita etiquetas de prueba como "María Suárez (VIP)" → "María Suárez". */
export function limpiarNombreClienta(nombre?: string): string {
  return (nombre ?? "Clienta").replace(/\s*\([^)]*\)\s*$/, "").trim() || "Clienta"
}
