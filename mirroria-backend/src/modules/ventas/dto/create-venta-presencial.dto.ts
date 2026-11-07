import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
  Max,
} from 'class-validator';

export class VentaItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  @Max(1000)
  cantidad!: number;

  /** Solo cuenta en una venta hecha sin conexión: es lo que la caja cobró. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  precioUnitCents?: number;
}

export class CreateVentaPresencialDto {
  @IsUUID()
  sucursalId!: string;

  // cajeroId ya NO viene en el body — sale de @CurrentUser() en el
  // controller (no hay que confiar en que el cliente no mienta sobre su
  // propia identidad, mismo motivo que el checkout de carrito).
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  // Si la venta concreta una reserva (cliente se probó las prendas en
  // tienda y decidió comprar), referenciarla acá — VentasService la marca
  // COMPLETADA y libera su cantidadReservada automáticamente.
  @IsOptional()
  @IsUUID()
  reservaId?: string;

  @IsOptional()
  @IsString()
  codigoCupon?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items!: VentaItemDto[];

  /** Cuándo se vendió sin conexión: la caja ya cobró, se respeta ese precio. */
  @IsOptional()
  @IsDateString()
  vendidaSinConexionEn?: string;
}
