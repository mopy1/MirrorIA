import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class ItemCheckoutDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CheckoutCarritoDto {
  @IsUUID()
  sucursalId!: string;

  // Solo digital acá — PRESENCIAL usa el endpoint dedicado del cajero
  // (POST /ventas/presenciales), que no pasa por un carrito.
  @IsIn(['WEB', 'MOVIL'])
  canal!: 'WEB' | 'MOVIL';

  @IsOptional()
  @IsString()
  codigoCupon?: string;

  /** Compra hecha sin conexión: viene con sus prendas, el carrito del servidor no las tiene. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemCheckoutDto)
  items?: ItemCheckoutDto[];
}
