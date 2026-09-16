import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoDescuentoCupon } from '../entities/cupon.entity.js';

export class CreateCuponDto {
  @ApiProperty({ example: 'VERANO20' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo!: string;

  @ApiProperty({ enum: TipoDescuentoCupon, example: TipoDescuentoCupon.PORCENTAJE })
  @IsEnum(TipoDescuentoCupon)
  tipoDescuento!: TipoDescuentoCupon;

  @ApiProperty({
    example: 20,
    description: 'Si es PORCENTAJE: número entre 1 y 100. Si es MONTO_FIJO: monto en centavos (ej: 5000 = Bs. 50).',
  })
  @IsInt()
  @Min(1)
  valor!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  fechaFin!: string;

  @ApiProperty({ example: 100, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  usosMaximos?: number | null;

  @ApiProperty({
    example: 10000,
    required: false,
    nullable: true,
    description: 'Monto mínimo en centavos para poder aplicar el cupón',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  montoMinimoCents?: number | null;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
