import { apiFetch } from '@/src/lib/api';
import type { Pago, Reserva, SucursalStaff, Venta } from '../types/staff.types';

function conFiltro(ruta: string, filtro: Record<string, string | undefined>): string {
  const qs = Object.entries(filtro)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return qs ? `${ruta}?${qs}` : ruta;
}

/** Los mismos endpoints que el panel web. El backend recorta a la sucursal del encargado/cajero. */
export const staffApi = {
  sucursales: () => apiFetch<SucursalStaff[]>('/sucursales'),

  // Ventas (ADMIN, ENCARGADO_SUCURSAL)
  ventas: (sucursalId?: string) => apiFetch<Venta[]>(conFiltro('/ventas', { sucursalId })),

  // Cobros por confirmar (ADMIN, CAJERO)
  pagosPendientes: () => apiFetch<Pago[]>('/pagos/pendientes'),
  confirmarPago: (pagoId: string) => apiFetch<Pago>(`/pagos/${pagoId}/confirmar`, { method: 'POST' }),

  // Reservas (todo el equipo)
  reservas: (filtro: { sucursalId?: string; estado?: string } = {}) => apiFetch<Reserva[]>(conFiltro('/reservas', filtro)),
  cambiarEstadoReserva: (id: string, estado: string) =>
    apiFetch<Reserva>(`/reservas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
};
