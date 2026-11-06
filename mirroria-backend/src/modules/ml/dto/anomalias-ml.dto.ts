export interface ItemDiagnosticoAnomaliaDto {
  venta_id: string;
  monto_total_cents?: number;
  descuento_cents?: number;
  hora_venta?: number;
  metodo_pago?: string;
  score_anomalia: number;
  es_anomalo: boolean;
  nivel_riesgo: 'NORMAL' | 'MODERADO' | 'CRITICO';
  motivo_sospecha?: string | null;
}

export interface AnomaliasMlResponseDto {
  total_analizadas: number;
  anomalias_detectadas: number;
  tasa_anomalias_pct: number;
  monto_sospechoso_cents: number;
  diagnosticos: ItemDiagnosticoAnomaliaDto[];
  fallback?: boolean;
}
