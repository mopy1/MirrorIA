import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { VentaDto } from '@/features/pagos/api/pagos.api';

/** Espejo de `ReservaResponseDto`. */
export interface ReservaDto {
  id: string;
  sucursalId: string;
  estado: string;
  fechaHoraPrevista: string;
  createdAt: string;
  items: { id: string; varianteId: string; cantidad: number }[];
}

export const misReservas = () => apiFetch<ReservaDto[]>(EP.misReservas);
export const obtenerReserva = (id: string) => apiFetch<ReservaDto>(EP.reserva(id));
export const cancelarReserva = (id: string) => apiFetch<ReservaDto>(EP.cancelarReserva(id), { metodo: 'PATCH' });

/**
 * "Comprar lo que reservé" (H7): `POST /ventas/desde-reserva/:id` → venta PENDIENTE con `reservaId`
 * que se paga como el checkout. Solo con red (D4). La clave la fija quien llama (un intento = una clave).
 */
export const comprarReserva = (id: string, idempotencyKey: string, codigoCupon?: string) =>
  apiFetch<VentaDto>(EP.comprarReserva(id), {
    metodo: 'POST',
    cuerpo: { canal: 'MOVIL', ...(codigoCupon ? { codigoCupon } : {}) },
    idempotencyKey,
  });
