import { API_URL, apiFetch, tiendaActual } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import type { RespuestaCaja } from '@/src/lib/offline/colaCaja';
import type { ItemMostrador } from '../lib/venta-caja';

export interface SucursalCaja {
  id: string;
  nombre: string;
}

export const mostradorApi = {
  /** Foto del stock de la sucursal (ADMIN, CAJERO): alimenta la caja sin conexión. */
  getCatalogo: (sucursalId: string) =>
    apiFetch<ItemMostrador[]>(`/inventario/mostrador?sucursalId=${encodeURIComponent(sucursalId)}`),

  getSucursales: () => apiFetch<SucursalCaja[]>('/sucursales'),

  /**
   * POST /ventas/presenciales con el cuerpo YA serializado (el mismo texto que guarda la cola).
   * Sin apiFetch a propósito: hace falta el status y el código crudos, y un 401 acá no debe
   * cerrar la sesión con ventas pendientes. Sin red lanza (fetch falla).
   */
  async enviarVenta(cuerpo: string, clave: string, tienda = tiendaActual()): Promise<RespuestaCaja> {
    const token = await storage.getItem('mirroria_token');
    const res = await fetch(`${API_URL}/ventas/presenciales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': clave,
        'X-Tenant': tienda,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo,
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  },
};
