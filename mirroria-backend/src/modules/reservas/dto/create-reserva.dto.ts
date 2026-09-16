import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ReservaItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;
}

export class CreateReservaDto {
  @IsUUID()
  sucursalId!: string;

  @IsDateString()
  fechaHoraPrevista!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReservaItemDto)
  items!: ReservaItemDto[];
}
