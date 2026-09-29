export class CupoReservaResponseDto {
  /** Si puede crear una reserva ahora mismo (activas < máximo y sin bloqueo). */
  puedeReservar!: boolean;
  /** Motivo legible cuando `puedeReservar` es false. */
  motivo!: string | null;
  reservasActivas!: number;
  maxReservasActivas!: number;
  faltasRecientes!: number;
  faltasParaBloqueo!: number;
  /** Fin del bloqueo por faltas, o null si no está bloqueada. */
  bloqueadaHasta!: Date | null;
  maxUnidadesPorVariante!: number;
  maxPrendasPorReserva!: number;
  anticipacionMinimaMinutos!: number;
  ventanaMaximaHoras!: number;
  toleranciaMinutos!: number;
}
