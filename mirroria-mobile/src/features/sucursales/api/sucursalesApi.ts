import { apiFetch } from '@/src/lib/api';
import type { SucursalResponseDto } from '../types/sucursales.types';

export const sucursalesApi = {
  /** Público — necesario para elegir dónde retirar/probar (checkout y reservas). */
  async getSucursales(): Promise<SucursalResponseDto[]> {
    return apiFetch<SucursalResponseDto[]>('/sucursales');
  },
};
