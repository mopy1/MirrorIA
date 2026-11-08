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

  /** PayPal: devuelve la URL para aprobar el pago; el cobro se captura al confirmar. */
  async iniciarPaypal(ventaId: string): Promise<SesionTarjetaResponse> {
    return apiFetch<SesionTarjetaResponse>(`/pagos/ventas/${ventaId}/paypal`, { method: 'POST' });
  },

  /** Al volver de Stripe o PayPal: el servidor le pregunta a la pasarela si se pagó. */
  async confirmarPasarela(ventaId: string): Promise<{ estado: string }> {
    return apiFetch<{ estado: string }>(`/pagos/ventas/${ventaId}/confirmar-tarjeta`, { method: 'POST' });
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
