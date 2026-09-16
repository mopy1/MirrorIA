import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateColeccionDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsUUID()
  temporadaId!: string;

  @IsUUID()
  proveedorId!: string;
}
