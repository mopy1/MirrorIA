import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RecepcionItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidadRecibida!: number;
}

export class RecibirOrdenCompraDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecepcionItemDto)
  items!: RecepcionItemDto[];
}
