import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';

/** `GET /reservas/mias/cupo`: reglas + situación de la clienta (para no ofrecer lo que el backend rechaza). */
export interface CupoReservas {
  puedeReservar: boolean;
  motivo: string | null;
  reservasActivas: number;
  maxReservasActivas: number;
  maxPrendasPorReserva: number;
  maxUnidadesPorVariante: number;
  anticipacionMinimaMinutos: number;
  ventanaMaximaHoras: number;
  toleranciaMinutos: number;
}

export const obtenerCupo = () => apiFetch<CupoReservas>(EP.cupoReservas);
