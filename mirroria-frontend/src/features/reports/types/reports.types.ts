import type { PasoEjecutado } from "./reports-hybrid.types"

export interface FilaReporte {
  clave: string
  etiqueta: string
  valor: number
  valorProyectado?: number
  valorOriginal?: number
  detalles?: Record<string, unknown>
}

export interface Variacion {
  clave: string
  etiqueta: string
  actual: number
  anterior: number
  deltaAbsoluto: number
  /** null cuando el periodo anterior fue 0: el porcentaje no existe. */
  deltaPorcentual: number | null
}

export interface Comparacion {
  rango: { desde: string; hasta: string }
  filas: FilaReporte[]
  variaciones: Variacion[]
}

export interface Ficha {
  metrica: string
  agruparPor: string
  filtros: Record<string, string | undefined>
  campoFecha?: "creacion" | "prevista"
  compararCon?: { desde: string; hasta: string }
  orden: "asc" | "desc"
  limite: number
}

export interface Reporte {
  ficha: Ficha
  filas: FilaReporte[]
  comparacion: Comparacion | null
  narrativa: string | null
  pasosEjecutados?: PasoEjecutado[]
  esSimulacion?: boolean
  tipoGraficoSugerido?: string
}
