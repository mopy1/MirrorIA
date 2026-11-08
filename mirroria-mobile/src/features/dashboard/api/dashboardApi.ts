import { apiFetch } from '@/src/lib/api';
import type { SucursalResponseDto } from '@/src/features/sucursales/types/sucursales.types';
import { consultaEjecutivo, consultaOperativo } from '../lib/periodo';
import type {
  DashboardEjecutivoDto,
  DashboardOperativoDto,
  FiltroDashboardEjecutivo,
} from '../types/dashboard.types';

/** Mismos endpoints que la web (features/dashboard/api/dashboardApi.ts). */
export const dashboardApi = {
  ejecutivo: (f: FiltroDashboardEjecutivo) => apiFetch<DashboardEjecutivoDto>(consultaEjecutivo(f)),
  operativo: (sucursalId?: string) => apiFetch<DashboardOperativoDto>(consultaOperativo(sucursalId)),
  /** "Ya llegó": pasa la reserva a EN_TIENDA (igual que useMarcarLlegada de la web). */
  marcarLlegada: (reservaId: string) =>
    apiFetch<unknown>(`/reservas/${reservaId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'EN_TIENDA' }),
    }),
  sucursalesActivas: async () =>
    (await apiFetch<SucursalResponseDto[]>('/sucursales')).filter((s) => s.activo !== false),
};
