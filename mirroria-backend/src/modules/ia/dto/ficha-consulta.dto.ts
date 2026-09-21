import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, Min, ValidateNested,
} from 'class-validator';
import { type Dimension, type Metrica, METRICAS } from '../service/catalogo-metricas.js';

const DIMENSIONES: Dimension[] = [
  'sucursal', 'categoria', 'producto', 'canal', 'estado',
  'cliente', 'cupon', 'proveedor', 'tipo_movimiento', 'dia', 'mes', 'ninguno',
];

export class FiltrosDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() desde?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() hasta?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sucursalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoriaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productoId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clienteId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() proveedorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canal?: string;
  /** Validado contra el dominio de la metrica en el motor, no aca. */
  @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoMovimiento?: string;
}

export class RangoDto {
  @ApiProperty() @IsISO8601() desde!: string;
  @ApiProperty() @IsISO8601() hasta!: string;
}

/**
 * El contrato que rellena el LLM. Es CERRADA a proposito
 * (ValidationPipe con `forbidNonWhitelisted` propio del controller de ia, ver Task 5):
 * cualquier propiedad que el modelo invente es 400, no algo que llegue a la base.
 */
export class FichaConsultaDto {
  @ApiProperty({ enum: METRICAS })
  @IsIn(METRICAS)
  metrica!: Metrica;

  @ApiProperty({ enum: DIMENSIONES })
  @IsIn(DIMENSIONES)
  agruparPor!: Dimension;

  @ApiPropertyOptional({ type: FiltrosDto })
  @IsOptional() @ValidateNested() @Type(() => FiltrosDto)
  filtros: FiltrosDto = new FiltrosDto();

  /** Solo metricas de reservas. Ver spec 4-bis.2. */
  @ApiPropertyOptional({ enum: ['creacion', 'prevista'] })
  @IsOptional() @IsIn(['creacion', 'prevista'])
  campoFecha?: 'creacion' | 'prevista';

  @ApiPropertyOptional({ type: RangoDto })
  @IsOptional() @ValidateNested() @Type(() => RangoDto)
  compararCon?: RangoDto;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsIn(['asc', 'desc'])
  orden: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  limite: number = 20;
}
