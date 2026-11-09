import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';

/** API key efímera (5 min, solo `lucy-vton-3.5`): la real (DECART_API_KEY) nunca sale del backend ni va en el APK. */
export interface TokenProbador {
  apiKey: string;
  expiresAt: string;
}

export const obtenerTokenProbador = () => apiFetch<TokenProbador>(EP.tokenProbador, { metodo: 'POST', tenant: false, auth: false });
