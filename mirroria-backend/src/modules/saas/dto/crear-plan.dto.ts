import { PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';

/** Cada tope: entero ≥ 1, o null (ilimitado). */
export class LimitesPlanInputDto {
  @IsOptional() @IsInt() @Min(1)
  maxSucursales!: number | null;

  @IsOptional() @IsInt() @Min(1)
  maxProductos!: number | null;

  @IsOptional() @IsInt() @Min(1)
  maxUsuariosStaff!: number | null;
}

export class CrearPlanDto {
  @Matches(/^[a-z0-9-]{3,30}$/, { message: 'codigo: 3-30 caracteres en minúscula, dígitos o guiones' })
  codigo!: string;

  @IsString() @MinLength(2) @MaxLength(60)
  nombre!: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsInt() @Min(0)
  precioMensualCents!: number;

  @IsInt() @Min(0)
  precioMensualUsdCents!: number;

  @IsOptional() @IsInt() @Min(0) @Max(60)
  diasPrueba?: number;

  @IsOptional() @IsInt()
  orden?: number;

  @ValidateNested() @Type(() => LimitesPlanInputDto)
  limites!: LimitesPlanInputDto;
}

export class ActualizarPlanDto extends PartialType(OmitType(CrearPlanDto, ['codigo'] as const)) {
  @IsOptional() @IsBoolean()
  activo?: boolean;
}
