import { ApiProperty } from '@nestjs/swagger';

export class InstruccionesResponseDto {
  @ApiProperty() pagoId!: string;
  @ApiProperty() metodo!: string;
  @ApiProperty() montoCents!: number;
  /** Lo que la clienta le dice al cajero para que encuentre su compra. */
  @ApiProperty() referencia!: string;
  @ApiProperty() instrucciones!: string;
}
