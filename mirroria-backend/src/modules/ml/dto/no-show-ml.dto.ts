import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FiltroNoShowDto {
  @ApiPropertyOptional({ description: 'ID de la sucursal para la agenda de hoy' })
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional({ description: 'ID de una reserva puntual para evaluar' })
  @IsOptional()
  @IsString()
  reservaId?: string;
}

export interface ItemEvaluacionNoShowDto {
  reserva_id: string;
  probabilidad_no_show: number;
  clasificacion: 'BAJO_RIESGO' | 'RIESGO_MEDIO' | 'ALTO_RIESGO';
  color_semaforo: 'VERDE' | 'AMARILLO' | 'ROJO';
  accion_recomendada: string;
  factores_clave: string[];
  hora_prevista?: string;
  cliente_nombre?: string;
  prendas_apartadas_count?: number;
}

export interface NoShowMlResponseDto {
  evaluaciones: ItemEvaluacionNoShowDto[];
  tasa_no_show_esperada_pct: number;
  alertas_criticas_count: number;
  fallback?: boolean;
}
