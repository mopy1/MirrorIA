import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FiltroDemandaDto {
  @ApiPropertyOptional({ description: 'Horizonte de proyección en días (7 o 30)', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  dias?: number = 30;

  @ApiPropertyOptional({ description: 'ID de la sucursal a consultar' })
  @IsOptional()
  @IsString()
  sucursalId?: string;
}

export interface ItemPrediccionDemandaDto {
  producto_id: string;
  demanda_proyectada_unidades: number;
  stock_actual: number;
  reabastecimiento_sugerido: number;
  riesgo_quiebre: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  dias_de_stock_estimados: number;
}

export interface KpisDemandaResumenDto {
  quiebre_stock_rate_pct: number;
  rotacion_proyectada: number;
}

export interface DemandaMlResponseDto {
  horizonte_dias: number;
  total_items_evaluados: number;
  predicciones: ItemPrediccionDemandaDto[];
  kpis_resumen: KpisDemandaResumenDto;
  fallback?: boolean;
}
