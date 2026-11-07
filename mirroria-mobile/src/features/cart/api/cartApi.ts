import * as Crypto from 'expo-crypto';
import { ApiError, apiFetch, tiendaActual } from '@/src/lib/api';
import {
  agregarAlCarrito, listarCarrito, marcarCambiosLocales, quitarDelCarrito, reemplazarCarrito,
  tieneCambiosLocales, vaciarCarrito,
} from '@/src/lib/offline/carritoLocal';
import { baseLocal } from '@/src/lib/offline/expoBase';
import { encolar } from '@/src/lib/offline/outboxLocal';
import type {
  CarritoItem,
  CarritoResponseDto,
  CheckoutCarritoRequest,
  VentaResponseDto,
} from '../types/cart.types';

const sinRed = (e: unknown) => e instanceof ApiError && e.status === 0;
/** El mismo tope que aplica el servidor: sin red no se puede dejar pasar más. */
const MAX_UNIDADES = 3;

async function agregarConTope(db: Awaited<ReturnType<typeof baseLocal>>, d: { tienda: string; usuarioId: string }, item: CarritoItem) {
  const actual = (await listarCarrito(db, d)).find((i) => i.varianteId === item.varianteId)?.cantidad ?? 0;
  if (actual + item.cantidad > MAX_UNIDADES) {
    throw new ApiError(409, `Podés llevar hasta ${MAX_UNIDADES} unidades de la misma talla y color por compra`);
  }
  return agregarAlCarrito(db, d, item);
}
const respuestaLocal = (usuarioId: string, items: CarritoItem[]): CarritoResponseDto => ({ id: 'local', usuarioId, items });

export type ResultadoCompra = { encolada: false; venta: VentaResponseDto } | { encolada: true };

async function cambiarLocal(usuarioId: string, cambio: (d: { tienda: string; usuarioId: string }) => Promise<CarritoItem[]>) {
  const db = await baseLocal();
  const d = { tienda: tiendaActual(), usuarioId };
  const items = await cambio(d);
  await marcarCambiosLocales(db, d);
  return respuestaLocal(usuarioId, items);
}

export const cartApi = {
  async getCarrito(usuarioId: string): Promise<CarritoResponseDto> {
    const db = await baseLocal();
    const d = { tienda: tiendaActual(), usuarioId };
    if (await tieneCambiosLocales(db, d)) return respuestaLocal(usuarioId, await listarCarrito(db, d));
    try {
      const carrito = await apiFetch<CarritoResponseDto>(`/ventas/carrito/${usuarioId}`);
      await reemplazarCarrito(db, d, carrito.items);
      return carrito;
    } catch (e) {
      if (!sinRed(e)) throw e;
      return respuestaLocal(usuarioId, await listarCarrito(db, d));
    }
  },

  async addItem(
    usuarioId: string,
    varianteId: string,
    cantidad: number,
  ): Promise<CarritoResponseDto> {
    const db = await baseLocal();
    const d = { tienda: tiendaActual(), usuarioId };
    if (await tieneCambiosLocales(db, d)) {
      return cambiarLocal(usuarioId, (x) => agregarConTope(db, x, { varianteId, cantidad }));
    }
    try {
      return await apiFetch<CarritoResponseDto>(`/ventas/carrito/${usuarioId}/items`, {
        method: 'POST',
        body: JSON.stringify({ varianteId, cantidad }),
      });
    } catch (e) {
      if (!sinRed(e)) throw e;
      return cambiarLocal(usuarioId, (x) => agregarConTope(db, x, { varianteId, cantidad }));
    }
  },

  async removeItem(usuarioId: string, varianteId: string): Promise<CarritoResponseDto> {
    const db = await baseLocal();
    const d = { tienda: tiendaActual(), usuarioId };
    if (await tieneCambiosLocales(db, d)) {
      return cambiarLocal(usuarioId, (x) => quitarDelCarrito(db, x, varianteId));
    }
    try {
      return await apiFetch<CarritoResponseDto>(`/ventas/carrito/${usuarioId}/items/${varianteId}`, { method: 'DELETE' });
    } catch (e) {
      if (!sinRed(e)) throw e;
      return cambiarLocal(usuarioId, (x) => quitarDelCarrito(db, x, varianteId));
    }
  },

  /** Sin red la compra queda en la cola con su clave: si la respuesta se perdió, reintentar no duplica. */
  async checkout(
    usuarioId: string,
    dto: CheckoutCarritoRequest,
    items: CarritoItem[],
  ): Promise<ResultadoCompra> {
    const db = await baseLocal();
    const d = { tienda: tiendaActual(), usuarioId };
    const clave = Crypto.randomUUID();
    const endpoint = `/ventas/carrito/${usuarioId}/checkout`;
    const payload = { ...dto, items };
    try {
      const venta = await apiFetch<VentaResponseDto>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Idempotency-Key': clave },
      });
      await vaciarCarrito(db, d);
      return { encolada: false, venta };
    } catch (e) {
      if (!sinRed(e) && !(e instanceof ApiError && e.status >= 500)) throw e;
      await encolar(db, d, { id: Crypto.randomUUID(), clave, tipo: 'COMPRA', endpoint, payload });
      await vaciarCarrito(db, d);
      return { encolada: true };
    }
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
