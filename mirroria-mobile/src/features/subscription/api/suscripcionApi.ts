import { apiFetch } from '@/src/lib/api';
import type {
  CobroSuscripcionResponseDto, CobroWayra, ComprobanteWayra, EstadoCobroSuscripcionResponseDto,
  IniciarCobroSuscripcionDto, MiSuscripcionDto,
} from '../types/suscripcion.types';

const cobro = (id: string) => `/saas/mi-suscripcion/cobro/${encodeURIComponent(id)}`;

export const suscripcionApi = {
  getMiSuscripcion: () => apiFetch<MiSuscripcionDto>('/saas/mi-suscripcion'),
  cambiarPlan: (planCodigo: string) =>
    apiFetch<MiSuscripcionDto>('/saas/mi-suscripcion/plan', { method: 'PATCH', body: JSON.stringify({ planCodigo }) }),
  iniciarCobro: (dto: IniciarCobroSuscripcionDto) =>
    apiFetch<CobroSuscripcionResponseDto>('/saas/mi-suscripcion/cobro', { method: 'POST', body: JSON.stringify(dto) }),
  estadoCobro: (id: string) => apiFetch<EstadoCobroSuscripcionResponseDto>(`${cobro(id)}/estado`),
  /** Al volver de Stripe/PayPal: el backend le pregunta a la pasarela (la URL de regreso no prueba nada). */
  confirmarCobro: (id: string) => apiFetch<EstadoCobroSuscripcionResponseDto>(`${cobro(id)}/confirmar`, { method: 'POST' }),
  simularPago: (id: string) => apiFetch<EstadoCobroSuscripcionResponseDto>(`${cobro(id)}/simular-pago`, { method: 'POST' }),
};

/** La "app del banco" Wayra (simulado): sin sesión, el token del QR es la única llave. */
export const wayraApi = {
  verCobro: (token: string) => apiFetch<CobroWayra>(`/wayra/cobros/${encodeURIComponent(token)}`),
  pagar: (token: string, cuenta: string, pin: string) =>
    apiFetch<ComprobanteWayra>(`/wayra/cobros/${encodeURIComponent(token)}/pagar`, {
      method: 'POST',
      body: JSON.stringify({ cuenta, pin }),
    }),
};
