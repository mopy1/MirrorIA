import { IsInt, IsNotEmpty, IsString, IsUUID, NotEquals } from 'class-validator';

export class AjustarStockDto {
  @IsUUID()
  varianteId!: string;

  @IsUUID()
  sucursalId!: string;

  // Delta: positivo suma, negativo resta. No se acepta 0 (no sería un ajuste).
  @IsInt()
  @NotEquals(0)
  cantidad!: number;

  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
