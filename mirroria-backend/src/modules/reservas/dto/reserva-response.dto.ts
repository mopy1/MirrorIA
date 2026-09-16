export class ReservaItemResponseDto {
  id!: string;
  varianteId!: string;
  cantidad!: number;
}

export class ReservaResponseDto {
  id!: string;
  clienteId!: string;
  sucursalId!: string;
  estado!: string;
  fechaHoraPrevista!: Date;
  createdAt!: Date;
  items!: ReservaItemResponseDto[];
}
