export interface ItemClientaRfmDto {
  clienta_id: string;
  cliente_nombre?: string;
  recency_dias: number;
  frequency_compras: number;
  monetary_cents: number;
  cluster_id: number;
  segmento: 'VIPS_LEALES' | 'POTENCIALES_NUEVAS' | 'EN_RIESGO_DORMIDAS' | 'OCASIONALES_OUTLET';
  clv_estimado_bs: number;
  estrategia_sugerida: string;
}

export interface RfmMlResponseDto {
  total_clientas: number;
  distribucion_clusters: Record<string, number>;
  clientas_clasificadas: ItemClientaRfmDto[];
  tasa_retencion_estimada_pct: number;
  clv_promedio_bs: number;
  fallback?: boolean;
}
