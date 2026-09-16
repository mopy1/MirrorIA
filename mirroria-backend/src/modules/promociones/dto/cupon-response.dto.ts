import { ApiProperty } from '@nestjs/swagger';
import { TipoDescuentoCupon } from '../entities/cupon.entity.js';

export class CuponResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  codigo!: string;

  @ApiProperty({ enum: TipoDescuentoCupon })
  tipoDescuento!: TipoDescuentoCupon;

  @ApiProperty()
  valor!: number;

  @ApiProperty()
  fechaInicio!: Date;

  @ApiProperty()
  fechaFin!: Date;

  @ApiProperty({ nullable: true })
  usosMaximos!: number | null;

  @ApiProperty()
  usosActuales!: number;

  @ApiProperty({ nullable: true })
  montoMinimoCents!: number | null;

  @ApiProperty()
  activo!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
