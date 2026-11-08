import { apiFetch } from '@/src/lib/api';
import type { CreateCuponDto, Cupon } from '../types/cupones.types';

/** Mismos endpoints que promotionsApi de la web (solo ADMIN). */
export const cuponesApi = {
  getCupones: () => apiFetch<Cupon[]>('/promociones/cupones'),

  createCupon: (dto: CreateCuponDto) =>
    apiFetch<Cupon>('/promociones/cupones', { method: 'POST', body: JSON.stringify(dto) }),

  /** Alterna activo/inactivo (el backend no tiene edición del resto de los campos). */
  toggleEstado: (id: string) => apiFetch<Cupon>(`/promociones/cupones/${id}/estado`, { method: 'PATCH' }),
};
