import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested, Max } from 'class-validator';

export class ItemCheckoutDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  cantidad!: number;
}

export class CheckoutCarritoDto {
  @IsUUID()
  sucursalId!: string;

  // Solo digital: ningún endpoint crea ventas PRESENCIAL (sin POS; el valor
  // queda en el enum por las ventas históricas).
  @IsIn(['WEB', 'MOVIL'])
  canal!: 'WEB' | 'MOVIL';

  @IsOptional()
  @IsString()
  codigoCupon?: string;

  /** Compra hecha sin conexión: viene con sus prendas, el carrito del servidor no las tiene. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ItemCheckoutDto)
  items?: ItemCheckoutDto[];
}
