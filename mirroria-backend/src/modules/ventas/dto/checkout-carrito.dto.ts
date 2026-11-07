import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
