import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import type { EstadoCobroQr } from './cobro-qr-response.dto.js';

export class CuentaWayraDto {
  @ApiProperty() id!: string;
  @ApiProperty() tipo!: string;
  @ApiProperty() numeroEnmascarado!: string;
  @ApiProperty() saldoCents!: number;
}

/** Lo que la app del banco muestra al abrir el QR escaneado. */
export class CobroWayraResponseDto {
  @ApiProperty() comercio!: string;
  @ApiProperty() glosa!: string;
  @ApiProperty() referencia!: string;
  @ApiProperty() montoCents!: number;
  @ApiProperty({ enum: ['PENDIENTE', 'PAGADO', 'VENCIDO'] }) estado!: EstadoCobroQr;
  @ApiProperty({ nullable: true }) transaccion!: string | null;
  @ApiProperty({ nullable: true }) pagadoEn!: Date | null;
  @ApiProperty() titular!: string;
  @ApiProperty({ type: [CuentaWayraDto] }) cuentas!: CuentaWayraDto[];
}

export class PagarWayraDto {
  @ApiProperty({ example: 'ahorro' })
  @IsString()
  cuenta!: string;

  @ApiProperty({ example: '1234', description: 'PIN de prueba: cualquier combinacion de 4 digitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN son 4 digitos' })
  pin!: string;
}

export class ComprobanteWayraResponseDto {
  @ApiProperty() transaccion!: string;
  @ApiProperty() comercio!: string;
  @ApiProperty() glosa!: string;
  @ApiProperty() referencia!: string;
  @ApiProperty() montoCents!: number;
  @ApiProperty() cuentaOrigen!: string;
  @ApiProperty() titular!: string;
  @ApiProperty() pagadoEn!: Date;
}
