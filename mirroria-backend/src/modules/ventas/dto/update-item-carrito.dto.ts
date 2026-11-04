import { IsInt, Max, Min } from 'class-validator';
import { REGLAS_COMPRA } from '../reglas-compra.js';

export class UpdateItemCarritoDto {
  @IsInt()
  @Min(1)
  @Max(REGLAS_COMPRA.maxUnidadesPorVariante)
  cantidad!: number;
}
