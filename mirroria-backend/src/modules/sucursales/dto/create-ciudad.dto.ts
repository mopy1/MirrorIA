import { IsString, MinLength } from 'class-validator';

export class CreateCiudadDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(2)
  pais!: string;
}
