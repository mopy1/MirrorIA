import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddItemCarritoDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;
}
