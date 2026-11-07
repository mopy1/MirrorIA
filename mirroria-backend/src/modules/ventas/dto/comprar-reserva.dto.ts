import { IsIn, IsOptional, IsString } from 'class-validator';

// Compra desde la reserva: sucursal e ítems salen de la reserva, no del body.
export class ComprarReservaDto {
  @IsIn(['WEB', 'MOVIL'])
  canal!: 'WEB' | 'MOVIL';

  @IsOptional()
  @IsString()
  codigoCupon?: string;
}
