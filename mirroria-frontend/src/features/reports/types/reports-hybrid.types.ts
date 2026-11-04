export interface FilaReporteHibrido {
  etiqueta: string
  valor: number
  valorProyectado?: number
  valorOriginal?: number
  detalles?: {
    original?: number
    deltaAbs?: number
    deltaPct?: number
    [key: string]: unknown
  }
}

export interface PasoEjecutado {
  paso: number
  herramienta: string
  argumentos: Record<string, unknown>
  resultadoResumen: string
}

export interface ReporteHibridoResponse {
  preguntaOriginal: string
  narrativa: string
  filas: FilaReporteHibrido[]
  pasosEjecutados: PasoEjecutado[]
  esSimulacion: boolean
  tipoGraficoSugerido?: string
}
