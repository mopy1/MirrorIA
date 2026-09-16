import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateTemporadaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;
}
