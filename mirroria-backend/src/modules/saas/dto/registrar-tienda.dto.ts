import { Transform, Type } from 'class-transformer';
import {
  IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateNested,
} from 'class-validator';
import { REGEX_SLUG } from '../../../core/tenancy/tenant.constants.js';
import { CODIGOS_PALETA, type CodigoPaleta } from '../marca/marca-reglas.js';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const slug = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class TiendaNuevaDto {
  @Transform(recortar) @IsString() @MinLength(3) @MaxLength(120)
  nombre!: string;

  @Transform(slug)
  @Matches(REGEX_SLUG, { message: 'slug: 3-40 caracteres (minúsculas, dígitos y guiones, sin guion en los extremos)' })
  slug!: string;

  /** Fase 1b: paleta inicial (default grafito). */
  @IsOptional() @IsIn(CODIGOS_PALETA, { message: `paleta: ${CODIGOS_PALETA.join(', ')}` })
  paleta?: CodigoPaleta;
}

export class SucursalInicialDto {
  @Transform(recortar) @IsString() @MinLength(3) @MaxLength(150)
  nombre!: string;

  @Transform(recortar) @IsString() @MinLength(5) @MaxLength(255)
  direccion!: string;

  @IsUUID()
  ciudadId!: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;
}

export class AdminInicialDto {
  @Transform(recortar) @IsString() @MinLength(2)
  fullName!: string;

  @Transform(recortar) @IsEmail()
  email!: string;

  @IsString() @MinLength(8)
  password!: string;
}

export class RegistrarTiendaDto {
  @IsString()
  planCodigo!: string;

  @ValidateNested() @Type(() => TiendaNuevaDto)
  tienda!: TiendaNuevaDto;

  @ValidateNested() @Type(() => SucursalInicialDto)
  sucursal!: SucursalInicialDto;

  @ValidateNested() @Type(() => AdminInicialDto)
  admin!: AdminInicialDto;
}
