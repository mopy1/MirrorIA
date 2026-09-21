import { ApiProperty } from '@nestjs/swagger';
import { FichaConsultaDto } from './ficha-consulta.dto.js';
import type { FilaReporte } from '../service/motor-consulta.service.js';

export interface VariacionDto {
  clave: string;
  etiqueta: string;
  actual: number;
  anterior: number;
  deltaAbsoluto: number;
  /** null cuando el periodo anterior es 0: el porcentaje no existe, no es infinito. */
  deltaPorcentual: number | null;
}

export interface ComparacionDto {
  rango: { desde: string; hasta: string };
  filas: FilaReporte[];
  variaciones: VariacionDto[];
}

export class ReporteResponseDto {
  /** La ficha ya interpretada: el usuario ve COMO se entendio su pregunta. */
  @ApiProperty({ type: FichaConsultaDto })
  ficha!: FichaConsultaDto;

  @ApiProperty()
  filas!: FilaReporte[];

  @ApiProperty({ nullable: true })
  comparacion!: ComparacionDto | null;

  @ApiProperty({ nullable: true })
  narrativa!: string | null;
}
