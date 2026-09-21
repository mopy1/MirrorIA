import { ApiProperty } from '@nestjs/swagger';
import { FichaConsultaDto } from './ficha-consulta.dto.js';
import type { FilaReporte } from '../service/motor-consulta.service.js';

export class ReporteResponseDto {
  /** La ficha ya interpretada: el usuario ve COMO se entendio su pregunta. */
  @ApiProperty({ type: FichaConsultaDto })
  ficha!: FichaConsultaDto;

  @ApiProperty()
  filas!: FilaReporte[];

  @ApiProperty({ nullable: true })
  comparacion!: unknown | null;

  @ApiProperty({ nullable: true })
  narrativa!: string | null;
}
