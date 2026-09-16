import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsUUID()
  padreId?: string;
}
