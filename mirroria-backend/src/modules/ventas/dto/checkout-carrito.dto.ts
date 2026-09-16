import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
