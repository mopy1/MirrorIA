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
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ImagenProductoDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsUUID()
  varianteId?: string;

  @IsOptional()
  @IsBoolean()
  esArAsset?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class CreateProductoDto {
  @IsUUID()
  categoriaId!: string;

  @IsUUID()
  coleccionId!: string;

  @IsString()
  @MinLength(2)
  titulo!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsInt()
  @IsPositive()
  precioCents!: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  modeloArUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenProductoDto)
  imagenes?: ImagenProductoDto[];
}
