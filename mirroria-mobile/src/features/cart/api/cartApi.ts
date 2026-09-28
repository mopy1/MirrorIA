import { apiFetch } from '@/src/lib/api';
import type {
  CarritoResponseDto,
  CheckoutCarritoRequest,
  VentaResponseDto,
} from '../types/cart.types';

export const cartApi = {
  async getCarrito(usuarioId: string): Promise<CarritoResponseDto> {
    return apiFetch<CarritoResponseDto>(`/ventas/carrito/${usuarioId}`);
  },

  async addItem(
    usuarioId: string,
    varianteId: string,
    cantidad: number,
  ): Promise<CarritoResponseDto> {
    return apiFetch<CarritoResponseDto>(`/ventas/carrito/${usuarioId}/items`, {
      method: 'POST',
      body: JSON.stringify({ varianteId, cantidad }),
    });
  },

  async removeItem(usuarioId: string, varianteId: string): Promise<CarritoResponseDto> {
    return apiFetch<CarritoResponseDto>(
      `/ventas/carrito/${usuarioId}/items/${varianteId}`,
      { method: 'DELETE' },
    );
  },

  async checkout(
    usuarioId: string,
    dto: CheckoutCarritoRequest,
  ): Promise<VentaResponseDto> {
    return apiFetch<VentaResponseDto>(`/ventas/carrito/${usuarioId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /** Para consultar el estado real de una compra propia (tras volver de la pasarela de pago). */
  async getVenta(ventaId: string): Promise<VentaResponseDto> {
    return apiFetch<VentaResponseDto>(`/ventas/${ventaId}`);
  },

  /** Historial de compras propias (RF: "Mis Pedidos & Compras" del perfil). */
  async misVentas(): Promise<VentaResponseDto[]> {
    return apiFetch<VentaResponseDto[]>('/ventas/mias');
  },
};
