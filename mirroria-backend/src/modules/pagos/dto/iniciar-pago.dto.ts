import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { MetodoPago } from '../entities/pago.entity.js';

export class IniciarPagoDto {
  @ApiProperty({ enum: [MetodoPago.QR, MetodoPago.EFECTIVO] })
  @IsIn([MetodoPago.QR, MetodoPago.EFECTIVO])
  metodo!: MetodoPago.QR | MetodoPago.EFECTIVO;
}
