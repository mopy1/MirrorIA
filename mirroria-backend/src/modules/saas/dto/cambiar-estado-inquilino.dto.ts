import { IsIn, IsString, Length, ValidateIf } from 'class-validator';
import { EstadoInquilino } from '../entities/inquilino.entity.js';

export class CambiarEstadoInquilinoDto {
  @IsIn([EstadoInquilino.ACTIVO, EstadoInquilino.SUSPENDIDO])
  estado!: EstadoInquilino;

  /** Obligatorio (5-255) si estado = SUSPENDIDO. */
  @ValidateIf((o: CambiarEstadoInquilinoDto) => o.estado === EstadoInquilino.SUSPENDIDO)
  @IsString()
  @Length(5, 255)
  motivo?: string;
}
