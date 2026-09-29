import { apiFetch } from '@/src/lib/api';
import type {
  CupoReserva,
  CreateReservaRequest,
  ReservaResponseDto,
} from '../types/reservas.types';

export const reservasApi = {
  async create(dto: CreateReservaRequest): Promise<ReservaResponseDto> {
    return apiFetch<ReservaResponseDto>('/reservas', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async misReservas(): Promise<ReservaResponseDto[]> {
    return apiFetch<ReservaResponseDto[]>('/reservas/mias');
  },

  async getCupo(): Promise<CupoReserva> {
    return apiFetch<CupoReserva>('/reservas/mias/cupo');
  },

  async cancelar(id: string): Promise<ReservaResponseDto> {
    return apiFetch<ReservaResponseDto>(`/reservas/${id}/cancelar`, {
      method: 'PATCH',
    });
  },
};
