import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSucursalDto {
  @IsUUID()
  ciudadId!: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(5)
  direccion!: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
