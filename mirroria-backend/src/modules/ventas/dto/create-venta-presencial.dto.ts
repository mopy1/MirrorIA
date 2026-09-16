import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class VentaItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;
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
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items!: VentaItemDto[];
}
