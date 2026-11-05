import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import { SECCIONES_MARCA, type SeccionMarca } from '../marca/marca-reglas.js';

/** Moderación: la plataforma restablece la marca de una tienda y deja el motivo en la bitácora. */
export class RestablecerMarcaPlataformaDto {
  @IsIn(SECCIONES_MARCA)
  seccion!: SeccionMarca;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString() @Length(5, 255)
  motivo!: string;
}
