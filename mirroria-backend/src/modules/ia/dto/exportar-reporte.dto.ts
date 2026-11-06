import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FichaConsultaDto } from './ficha-consulta.dto.js';
import { ReporteResponseDto, type ComparacionDto } from './reporte-response.dto.js';
import type { FilaReporte } from '../service/motor-consulta.service.js';

export class ExportarReporteDto {
  @ApiPropertyOptional({ description: 'Título personalizado para la cabecera del Excel' })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ type: FichaConsultaDto, description: 'Ficha analítica base' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FichaConsultaDto)
  ficha?: FichaConsultaDto;

  @ApiPropertyOptional({ type: ReporteResponseDto, description: 'Reporte completo (alternativo a ficha directa)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReporteResponseDto)
  reporte?: ReporteResponseDto;

  @ApiPropertyOptional({ description: 'Filas calculadas previas (opcional; si se omiten, el backend las ejecuta)' })
  @IsOptional()
  @IsArray()
  filas?: FilaReporte[];

  @ApiPropertyOptional({ description: 'Datos de variación de período anterior' })
  @IsOptional()
  comparacion?: ComparacionDto | null;

  @ApiPropertyOptional({ description: 'Narrativa explicativa generada por IA o resumen' })
  @IsOptional()
  @IsString()
  narrativa?: string;

  @ApiPropertyOptional({ description: 'Nombre de la tienda para membrete' })
  @IsOptional()
  @IsString()
  nombreTienda?: string;
}
