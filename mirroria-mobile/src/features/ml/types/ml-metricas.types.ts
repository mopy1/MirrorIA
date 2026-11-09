export interface MetricasModelo {
  tipo: string
  algoritmo: string
  cita_academica: string
  metricas: Record<string, unknown>
  kpi_asociado: string
}

export interface MetricasModelosResponse {
  fecha_evaluacion: string
  semilla_reproducible: number
  dataset_size_total: number
  modelos: {
    M1_demanda_random_forest: MetricasModelo
    M2_noshow_logistic_regression: MetricasModelo
    M3_rfm_kmeans: MetricasModelo
    M4_anomalias_isolation_forest: MetricasModelo
    [key: string]: unknown
  }
  fallback?: boolean
}
