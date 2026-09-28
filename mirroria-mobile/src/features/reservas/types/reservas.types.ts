export interface ReservaItemDto {
  varianteId: string;
  cantidad: number;
}

export interface ReservaItemResponseDto {
  id: string;
  varianteId: string;
  cantidad: number;
}

export interface ReservaResponseDto {
  id: string;
  clienteId: string;
  sucursalId: string;
  estado: string;
  fechaHoraPrevista: string;
  createdAt: string;
  items: ReservaItemResponseDto[];
}

export interface CreateReservaRequest {
  sucursalId: string;
  fechaHoraPrevista: string;
  items: ReservaItemDto[];
}
