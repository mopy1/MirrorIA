import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsPositive,
  IsUUID,
  Max,
  ValidateNested,
} from 'class-validator';
import { REGLAS_RESERVA } from '../reglas-reserva.js';

export class ReservaItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  @Max(REGLAS_RESERVA.maxUnidadesPorVariante, {
    message: `Podés reservar hasta ${REGLAS_RESERVA.maxUnidadesPorVariante} unidad por talla y color`,
  })
  cantidad!: number;
}

export class CreateReservaDto {
  @IsUUID()
  sucursalId!: string;

  @IsDateString()
  fechaHoraPrevista!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(REGLAS_RESERVA.maxPrendasPorReserva, {
    message: `Podés reservar hasta ${REGLAS_RESERVA.maxPrendasPorReserva} prendas por visita`,
  })
  @ValidateNested({ each: true })
  @Type(() => ReservaItemDto)
  items!: ReservaItemDto[];
}
