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

/** GET /reservas/mias/cupo — reglas de reserva y situación de la clienta. */
export interface CupoReserva {
  puedeReservar: boolean;
  motivo: string | null;
  reservasActivas: number;
  maxReservasActivas: number;
  faltasRecientes: number;
  faltasParaBloqueo: number;
  bloqueadaHasta: string | null;
  maxUnidadesPorVariante: number;
  maxPrendasPorReserva: number;
  anticipacionMinimaMinutos: number;
  ventanaMaximaHoras: number;
  toleranciaMinutos: number;
}
