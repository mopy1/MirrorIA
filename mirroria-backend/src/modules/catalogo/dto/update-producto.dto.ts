import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ImagenProductoDto } from './create-producto.dto.js';

export class UpdateProductoDto {
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  coleccionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  precioCents?: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  modeloArUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenProductoDto)
  imagenes?: ImagenProductoDto[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
