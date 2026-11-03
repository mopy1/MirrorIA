import { ApiProperty } from '@nestjs/swagger';

export type EstadoCobroQr = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

/** Lo que la tienda (web o app) muestra mientras espera que escaneen el QR. */
export class CobroQrResponseDto {
  @ApiProperty() pagoId!: string;
  @ApiProperty() ventaId!: string;
  @ApiProperty() montoCents!: number;
  /** El nombre con el que el comercio aparece en la app del banco. */
  @ApiProperty() comercio!: string;
  /** Lo mismo que lee la clienta en la glosa del banco: `#8F3A1C9E`. */
  @ApiProperty() referencia!: string;
  /** PNG del QR como data URL, listo para un <img> o un <Image> de React Native. */
  @ApiProperty() qrImagen!: string;
  /** Lo que codifica el QR: la URL que abre la camara del celular. */
  @ApiProperty() qrContenido!: string;
  @ApiProperty({ enum: ['PENDIENTE', 'PAGADO', 'VENCIDO'] }) estado!: EstadoCobroQr;
}

/** Lo que la tienda consulta cada pocos segundos hasta ver el pago. */
export class EstadoCobroQrResponseDto {
  @ApiProperty() pagoId!: string;
  @ApiProperty() ventaId!: string;
  @ApiProperty({ enum: ['PENDIENTE', 'PAGADO', 'VENCIDO'] }) estado!: EstadoCobroQr;
  @ApiProperty() montoCents!: number;
  /** Numero de transaccion que da el banco. Solo si ya se pago. */
  @ApiProperty({ nullable: true }) transaccion!: string | null;
  @ApiProperty({ nullable: true }) pagadoEn!: Date | null;
}
