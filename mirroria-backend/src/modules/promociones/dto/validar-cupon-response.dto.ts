import { ApiProperty } from '@nestjs/swagger';
import { CuponResponseDto } from './cupon-response.dto.js';

export class ValidarCuponResponseDto {
  @ApiProperty({ example: true })
  valido!: boolean;

  @ApiProperty({ required: false, example: 'Cupón aplicado con éxito' })
  mensaje?: string;

  @ApiProperty({ type: CuponResponseDto, required: false })
  cupon?: CuponResponseDto;

  @ApiProperty({ example: 2000, description: 'Monto del descuento en centavos' })
  descuentoCents!: number;

  @ApiProperty({ example: 8000, description: 'Total restante en centavos tras aplicar el descuento' })
  totalConDescuentoCents!: number;
}
