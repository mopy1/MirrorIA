import { IsDateString, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export enum PeriodoDashboard {
  HOY = 'hoy',
  SIETE_DIAS = '7d',
  TREINTA_DIAS = '30d',
  MES_ACTUAL = 'mes_actual',
  MES_ANTERIOR = 'mes_anterior',
  PERSONALIZADO = 'personalizado',
}

export class FiltroDashboardEjecutivoDto {
  @IsOptional()
  @IsEnum(PeriodoDashboard, {
    message: 'El periodo debe ser hoy, 7d, 30d, mes_actual, mes_anterior o personalizado',
  })
  periodo?: PeriodoDashboard = PeriodoDashboard.TREINTA_DIAS;

  @ValidateIf((o: FiltroDashboardEjecutivoDto) => o.periodo === PeriodoDashboard.PERSONALIZADO)
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha valida ISO (YYYY-MM-DD)' })
  fechaInicio?: string;

  @ValidateIf((o: FiltroDashboardEjecutivoDto) => o.periodo === PeriodoDashboard.PERSONALIZADO)
  @IsDateString({}, { message: 'fechaFin debe ser una fecha valida ISO (YYYY-MM-DD)' })
  fechaFin?: string;

  @IsOptional()
  @IsUUID('4', { message: 'sucursalId debe ser un UUID valido' })
  sucursalId?: string;
}
