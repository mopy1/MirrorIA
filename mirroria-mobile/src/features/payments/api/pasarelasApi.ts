import { apiFetch } from '@/src/lib/api';
import type { ContextoPasarela, PasarelaMetadata } from '../types/pasarelas.types';

export const pasarelasApi = {
  /** Qué pasarelas ofrece el servidor y si están listas (`estado`). */
  getPasarelas: (contexto?: ContextoPasarela) =>
    apiFetch<PasarelaMetadata[]>(`/pagos/pasarelas${contexto ? `?contexto=${contexto}` : ''}`),
};
