import { apiFetch } from '@/src/lib/api';

export interface TokenProbador {
  /** API key efímera de Decart — la real (DECART_API_KEY) nunca sale del backend. */
  apiKey: string;
  expiresAt: string;
}

export const probadorApi = {
  obtenerToken: () => apiFetch<TokenProbador>('/probador/token', { method: 'POST' }),
};
