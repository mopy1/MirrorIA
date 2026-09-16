import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsHexColor()
  hexCode?: string;
}
