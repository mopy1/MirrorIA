export type RiesgoQuiebre = "BAJO" | "MEDIO" | "ALTO" | "CRITICO"
export type ClasificacionNoShow = "BAJO_RIESGO" | "RIESGO_MEDIO" | "ALTO_RIESGO"
export type ColorSemaforo = "VERDE" | "AMARILLO" | "ROJO"
export type ClusterRfmTipo = "VIPS_LEALES" | "POTENCIALES_NUEVAS" | "EN_RIESGO_DORMIDAS" | "OCASIONALES_OUTLET"
export type NivelRiesgoAnomalia = "NORMAL" | "MODERADO" | "CRITICO"

// M1: Demanda
export interface ItemPrediccionDemanda {
  producto_id: string
  nombre?: string
  categoria?: string
  demanda_proyectada_unidades: number
  stock_actual: number
  reabastecimiento_sugerido: number
  riesgo_quiebre: RiesgoQuiebre
  dias_de_stock_estimados: number
}

export interface KpisDemandaResumen {
  quiebre_stock_rate_pct: number
  rotacion_proyectada: number
}

export interface DemandaMlResponse {
  horizonte_dias: number
  total_items_evaluados: number
  predicciones: ItemPrediccionDemanda[]
  kpis_resumen: KpisDemandaResumen
  fallback?: boolean
}

export interface FiltroDemanda {
  sucursalId?: string
  dias?: number
}

// M2: No-Show
export interface ItemEvaluacionNoShow {
  reserva_id: string
  probabilidad_no_show: number
  clasificacion: ClasificacionNoShow
  color_semaforo: ColorSemaforo
  accion_recomendada: string
  factores_clave: string[]
  hora_prevista?: string
  cliente_nombre?: string
  cliente_telefono?: string
  prendas_apartadas_count?: number
}

export interface NoShowAgendaResponse {
  evaluaciones: ItemEvaluacionNoShow[]
  tasa_no_show_esperada_pct: number
  alertas_criticas_count: number
  fallback?: boolean
}

export interface FiltroNoShow {
  sucursalId?: string
  reservaId?: string
}

// M3: Segmentación RFM
export interface ItemClientaRfm {
  clienta_id: string
  cliente_nombre?: string
  recency_dias: number
  frequency_compras: number
  monetary_cents: number
  cluster_id: number
  segmento: ClusterRfmTipo
  clv_estimado_bs: number
  estrategia_sugerida: string
}

export interface RfmSegmentosResponse {
  total_clientas: number
  distribucion_clusters: Record<string, number>
  clientas_clasificadas: ItemClientaRfm[]
  tasa_retencion_estimada_pct: number
  clv_promedio_bs: number
  fallback?: boolean
}

// M4: Anomalías
export interface ItemDiagnosticoAnomalia {
  venta_id: string
  monto_total_cents?: number
  descuento_cents?: number
  hora_venta?: number
  metodo_pago?: string
  score_anomalia: number
  es_anomalo: boolean
  nivel_riesgo: NivelRiesgoAnomalia
  motivo_sospecha?: string | null
}

export interface AnomaliasVentasResponse {
  total_analizadas: number
  anomalias_detectadas: number
  tasa_anomalias_pct: number
  monto_sospechoso_cents: number
  diagnosticos: ItemDiagnosticoAnomalia[]
  fallback?: boolean
}

export interface FiltroAnomalias {
  sucursalId?: string
}

// Re-export de métricas científicas
export type { MetricasModelo, MetricasModelosResponse } from "./ml-metricas.types"
