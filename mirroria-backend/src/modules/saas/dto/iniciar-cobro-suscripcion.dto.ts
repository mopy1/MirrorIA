import { IsEnum, IsOptional, IsString } from 'class-validator';

export class IniciarCobroSuscripcionDto {
  @IsEnum(['WAYRA', 'STRIPE', 'PAYPAL', 'QR_BANCARIO'], {
    message: 'pasarela debe ser WAYRA, STRIPE, PAYPAL o QR_BANCARIO',
  })
  pasarela!: 'WAYRA' | 'STRIPE' | 'PAYPAL' | 'QR_BANCARIO';

  @IsOptional()
  @IsString()
  planCodigo?: string;
}
