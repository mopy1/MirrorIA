import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateVarianteDto {
  @IsUUID()
  tallaId!: string;

  @IsUUID()
  colorId!: string;

  @IsString()
  @MinLength(2)
  sku!: string;
}
