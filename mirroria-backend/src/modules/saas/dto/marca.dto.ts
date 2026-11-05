import { Transform, Type } from 'class-transformer';
import {
  IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength, ValidateNested,
} from 'class-validator';
import {
  type CodigoPaleta, DESTINOS_CTA, type DestinoCta, FUENTES, type FuenteMarca, MODOS, type ModoMarca,
  type NivelMarca, RADIOS, type RadioMarca, REGEX_URL_IMAGEN, SECCIONES_MARCA, type SeccionMarca,
} from '../marca/marca-reglas.js';

/** Recorta; '' → null (el front puede mandar campos opcionales vacíos). */
const opcional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  return v === '' ? null : v;
};
const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const hex = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const sinArroba = ({ value }: { value: unknown }) => {
  const v = opcional({ value });
  return typeof v === 'string' ? v.replace(/^@/, '') : v;
};
const soloDigitos = ({ value }: { value: unknown }) => {
  const v = opcional({ value });
  return typeof v === 'string' ? v.replace(/[\s-]/g, '') : v;
};
const URL_MSG = 'debe ser una URL https:// o una imagen /images/… (sin http:, data: ni javascript:)';
const HEX_MSG = 'debe ser un color #RRGGBB';

export class HeroMarcaDto {
  @Transform(recortar) @Matches(REGEX_URL_IMAGEN, { message: `hero.imagenUrl ${URL_MSG}` })
  imagenUrl!: string;

  @Transform(recortar) @IsString() @Length(3, 80)
  titulo!: string;

  @Transform(opcional) @IsOptional() @IsString() @MaxLength(160)
  subtitulo!: string | null;

  @Transform(recortar) @IsString() @Length(2, 24)
  ctaTexto!: string;

  @IsIn(DESTINOS_CTA)
  ctaDestino!: DestinoCta;

  @IsBoolean()
  mostrarProbador!: boolean;
}

export class ImagenesMarcaDto {
  @Transform(opcional) @IsOptional() @Matches(REGEX_URL_IMAGEN, { message: `imagenes.bannerSucursales ${URL_MSG}` })
  bannerSucursales!: string | null;

  @Transform(opcional) @IsOptional() @Matches(REGEX_URL_IMAGEN, { message: `imagenes.probador ${URL_MSG}` })
  probador!: string | null;

  @Transform(opcional) @IsOptional() @Matches(REGEX_URL_IMAGEN, { message: `imagenes.acceso ${URL_MSG}` })
  acceso!: string | null;
}

export class TextosMarcaDto {
  @Transform(opcional) @IsOptional() @IsString() @MaxLength(120)
  eslogan!: string | null;

  @Transform(opcional) @IsOptional() @IsString() @MaxLength(600)
  sobreNosotros!: string | null;
}

export class ContactoMarcaDto {
  @Transform(sinArroba) @IsOptional() @Matches(/^[A-Za-z0-9._]{1,30}$/, { message: 'instagram: usuario sin @' })
  instagram!: string | null;

  @Transform(sinArroba) @IsOptional() @Matches(/^[A-Za-z0-9.]{1,60}$/, { message: 'facebook: usuario o página' })
  facebook!: string | null;

  @Transform(sinArroba) @IsOptional() @Matches(/^[A-Za-z0-9._]{1,60}$/, { message: 'tiktok: usuario sin @' })
  tiktok!: string | null;

  @Transform(soloDigitos) @IsOptional() @Matches(/^\+?[0-9]{8,15}$/, { message: 'whatsapp: 8 a 15 dígitos' })
  whatsapp!: string | null;

  @Transform(opcional) @IsOptional() @IsEmail() @MaxLength(120)
  email!: string | null;
}

/** Lo que ve cualquiera: la marca EFECTIVA (ya recortada por el nivel del plan). */
export class MarcaPublicaDto {
  @Transform(opcional) @IsOptional() @Matches(REGEX_URL_IMAGEN, { message: `logoUrl ${URL_MSG}` })
  logoUrl!: string | null;

  @Transform(opcional) @IsOptional() @Matches(REGEX_URL_IMAGEN, { message: `faviconUrl ${URL_MSG}` })
  faviconUrl!: string | null;

  @Transform(hex) @Matches(/^#[0-9A-F]{6}$/, { message: `colorPrimario ${HEX_MSG}` })
  colorPrimario!: string;

  @Transform(hex) @Matches(/^#[0-9A-F]{6}$/, { message: `colorAcento ${HEX_MSG}` })
  colorAcento!: string;

  @IsIn(MODOS)
  modo!: ModoMarca;

  @IsIn(RADIOS)
  radio!: RadioMarca;

  @IsIn(FUENTES)
  fuente!: FuenteMarca;

  @ValidateNested() @Type(() => HeroMarcaDto)
  hero!: HeroMarcaDto;

  @ValidateNested() @Type(() => ImagenesMarcaDto)
  imagenes!: ImagenesMarcaDto;

  @ValidateNested() @Type(() => TextosMarcaDto)
  textos!: TextosMarcaDto;

  @ValidateNested() @Type(() => ContactoMarcaDto)
  contacto!: ContactoMarcaDto;

  @IsBoolean()
  mostrarInsignia!: boolean;
}

/** PUT /saas/mi-marca: objeto completo (sin ambigüedad null/undefined). */
export class ActualizarMarcaDto extends MarcaPublicaDto {
  /** → inquilinos.nombre (el slug sigue inmutable). */
  @Transform(recortar) @IsString() @Length(3, 120)
  nombre!: string;
}

export class RestablecerMarcaDto {
  @IsIn(SECCIONES_MARCA)
  seccion!: SeccionMarca;
}

export class MiMarcaDto {
  nombre!: string;
  slug!: string;
  paleta!: CodigoPaleta | 'mirroria';
  /** Lo que está en la fila (aunque el plan no lo aplique). */
  guardada!: MarcaPublicaDto;
  /** Lo que ve el público. */
  efectiva!: MarcaPublicaDto;
  nivel!: NivelMarca;
  planNombre!: string;
  permitido!: { estilo: boolean; imagenesSecciones: boolean; favicon: boolean; quitarInsignia: boolean };
}

export class MarcaMiniDto {
  logoUrl!: string | null;
  colorPrimario!: string;
  heroImagenUrl!: string;
}
