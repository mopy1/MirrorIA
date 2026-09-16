import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ValidarCuponDto {
  @ApiProperty({ example: 'VERANO20' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiProperty({ example: 15000, description: 'Subtotal del carrito en centavos' })
  @IsInt()
  @Min(1)
  subtotalCents!: number;
}
