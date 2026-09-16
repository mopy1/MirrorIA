import { IsIn } from 'class-validator';

// COMPLETADA no está acá a propósito: solo se llega ahí automáticamente
// cuando una venta presencial referencia la reserva (ver ReservasService.
// completarPorVenta) — nunca por una transición manual.
const ESTADOS_TRANSICION_MANUAL = [
  'CONFIRMADA',
  'EN_TIENDA',
  'CANCELADA',
  'EXPIRADA',
  'NO_SHOW',
] as const;

export class CambiarEstadoReservaDto {
  @IsIn(ESTADOS_TRANSICION_MANUAL)
  estado!: (typeof ESTADOS_TRANSICION_MANUAL)[number];
}
