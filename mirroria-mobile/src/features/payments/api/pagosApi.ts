import { apiFetch } from '@/src/lib/api';
import type {
  InstruccionesResponseDto,
  MetodoPagoManual,
  SesionTarjetaResponse,
} from '../types/payments.types';

export const pagosApi = {
  /** Devuelve la URL alojada por Stripe — se abre en el navegador del sistema, nunca en un WebView con formulario propio. */
  async iniciarTarjeta(ventaId: string): Promise<SesionTarjetaResponse> {
    return apiFetch<SesionTarjetaResponse>(`/pagos/ventas/${ventaId}/sesion`, {
      method: 'POST',
    });
  },

  async iniciarManual(
    ventaId: string,
    metodo: MetodoPagoManual,
  ): Promise<InstruccionesResponseDto> {
    return apiFetch<InstruccionesResponseDto>(`/pagos/ventas/${ventaId}/manual`, {
      method: 'POST',
      body: JSON.stringify({ metodo }),
    });
  },
};
