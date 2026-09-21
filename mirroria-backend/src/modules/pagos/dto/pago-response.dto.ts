import { ApiProperty } from '@nestjs/swagger';

export class PagoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() ventaId!: string;
  @ApiProperty() proveedorPago!: string;
  @ApiProperty() metodo!: string;
  @ApiProperty() montoCents!: number;
  @ApiProperty() estado!: string;
  @ApiProperty({ nullable: true }) referenciaExterna!: string | null;
  @ApiProperty() createdAt!: Date;
}
