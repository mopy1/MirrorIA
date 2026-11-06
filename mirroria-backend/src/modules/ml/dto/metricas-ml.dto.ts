export interface MetricasModeloDto {
  tipo: string;
  algoritmo: string;
  cita_academica: string;
  metricas: Record<string, any>;
  kpi_asociado: string;
}

export interface MetricasModelosMlResponseDto {
  fecha_evaluacion: string;
  semilla_reproducible: number;
  dataset_size_total: number;
  modelos: {
    M1_demanda_random_forest: MetricasModeloDto;
    M2_noshow_logistic_regression: MetricasModeloDto;
    M3_rfm_kmeans: MetricasModeloDto;
    M4_anomalias_isolation_forest: MetricasModeloDto;
    [key: string]: any;
  };
  fallback?: boolean;
}
