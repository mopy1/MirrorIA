// Formato de los KPIs de la plataforma (puro, con test).

export type Tendencia = "sube" | "baja" | "igual"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

/** `'2026-10'` → `'oct'` (eje del gráfico). */
export function mesCorto(mes: string): string {
  const n = Number(mes.slice(5, 7))
  return MESES[n - 1]?.slice(0, 3) ?? mes
}

/** Nombre del mes anterior al de `hoy`, para "+3 vs octubre". */
export function mesAnterior(hoy = new Date()): string {
  return MESES[(hoy.getMonth() + 11) % 12]
}

/** Variación con texto explícito (el color nunca es el único portador del dato). */
export function variacion(actual: number, anterior: number, contra: string): { tendencia: Tendencia; texto: string } {
  const d = actual - anterior
  if (d === 0) return { tendencia: "igual", texto: `igual que ${contra}` }
  return { tendencia: d > 0 ? "sube" : "baja", texto: `${d > 0 ? "+" : "−"}${Math.abs(d)} vs ${contra}` }
}

/** `0.1234` → `"12,3 %"`. */
export function porcentaje(tasa: number): string {
  return `${(tasa * 100).toLocaleString("es-BO", { maximumFractionDigits: 1 })} %`
}

/** "hace 2 h", "hace 3 días", "recién" (bitácora). */
export function haceCuanto(iso: string, ahora = Date.now()): string {
  const min = Math.floor((ahora - new Date(iso).getTime()) / 60000)
  if (Number.isNaN(min)) return ""
  if (min < 1) return "recién"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "ayer" : `hace ${d} días`
}
