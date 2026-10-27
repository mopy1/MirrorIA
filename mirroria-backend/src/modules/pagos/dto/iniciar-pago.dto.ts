import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { MetodoPago } from '../entities/pago.entity.js';

/**
 * Solo efectivo: el QR tiene su propio endpoint (`POST /pagos/ventas/:id/qr`),
 * que genera un QR por compra y se acredita solo cuando el banco avisa.
 */
export class IniciarPagoDto {
  @ApiProperty({ enum: [MetodoPago.EFECTIVO] })
  @IsIn([MetodoPago.EFECTIVO])
  metodo!: MetodoPago.EFECTIVO;
}
