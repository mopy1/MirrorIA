import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class OrdenCompraItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidadPedida!: number;
}

export class CreateOrdenCompraDto {
  @IsUUID()
  proveedorId!: string;

  @IsUUID()
  sucursalDestinoId!: string;

  @IsUUID()
  usuarioId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraItemDto)
  items!: OrdenCompraItemDto[];

  @IsOptional()
  @IsDateString()
  fechaEsperada?: string;
}
