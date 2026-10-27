import { apiFetch } from '@/src/lib/api';
import type {
  CobroQrResponseDto,
  EstadoCobroQrResponseDto,
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

  /** QR por compra: se acredita solo cuando el banco avisa, nadie lo confirma a mano. */
  async iniciarQr(ventaId: string): Promise<CobroQrResponseDto> {
    return apiFetch<CobroQrResponseDto>(`/pagos/ventas/${ventaId}/qr`, { method: 'POST' });
  },

  async estadoQr(pagoId: string): Promise<EstadoCobroQrResponseDto> {
    return apiFetch<EstadoCobroQrResponseDto>(`/pagos/qr/${pagoId}`);
  },
};
