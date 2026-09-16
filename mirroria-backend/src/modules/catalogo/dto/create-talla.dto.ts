import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTallaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsInt()
  orden?: number;
}
