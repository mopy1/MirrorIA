import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MinLength(2)
  razonSocial!: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  contactoNombre?: string;

  @IsOptional()
  @IsEmail()
  contactoEmail?: string;

  @IsOptional()
  @IsString()
  contactoTelefono?: string;
}
