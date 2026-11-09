import { apiFetch } from '@/src/lib/api';
import type { SeccionMarca } from '../../saas/types/saas.types';
import type { BorradorMarca, MiMarcaDto } from '../types/apariencia.types';

// Rutas del ADMIN de la tienda de la sesión: el tenant sale del token y de X-Tenant.
export const aparienciaApi = {
  getMiMarca: () => apiFetch<MiMarcaDto>('/saas/mi-marca'),
  guardar: (dto: BorradorMarca) => apiFetch<MiMarcaDto>('/saas/mi-marca', { method: 'PUT', body: JSON.stringify(dto) }),
  restablecer: (seccion: SeccionMarca) =>
    apiFetch<MiMarcaDto>('/saas/mi-marca/restablecer', { method: 'POST', body: JSON.stringify({ seccion }) }),
};
