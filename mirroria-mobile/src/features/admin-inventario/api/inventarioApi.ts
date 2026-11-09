import { apiFetch } from '@/src/lib/api';
import { catalogoAdminApi } from '@/src/features/admin-catalogo/api/catalogoAdminApi';
import { aplanarVariantes } from '../lib/stock';
import type {
  AjustarStockDto,
  CreateOrdenCompraDto,
  InventarioSucursal,
  MovimientoInventario,
  OrdenCompra,
  RecibirOrdenCompraDto,
  Sucursal,
  VarianteConProducto,
} from '../types/inventario.types';

const json = (body: unknown) => JSON.stringify(body);

function qs(filtro: Record<string, string | undefined>): string {
  const p = Object.entries(filtro).filter(([, v]) => v) as [string, string][];
  return p.length ? `?${p.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}` : '';
}

/** Mismos endpoints que la web: inventoryApi + purchaseOrdersApi + branchesApi. */
export const inventarioApi = {
  getSucursales: () => apiFetch<Sucursal[]>('/sucursales'),
  getDisponibilidad: (filtro: { sucursalId?: string; varianteId?: string }) =>
    apiFetch<InventarioSucursal[]>(`/inventario${qs(filtro)}`),
  ajustarStock: (dto: AjustarStockDto) => apiFetch<InventarioSucursal>('/inventario/ajustes', { method: 'POST', body: json(dto) }),
  // El backend ya limita a la encargada a su sucursal (la del token manda).
  getMovimientos: (filtro: { sucursalId?: string; varianteId?: string }) =>
    apiFetch<MovimientoInventario[]>(`/inventario/movimientos${qs(filtro)}`),

  getOrdenes: () => apiFetch<OrdenCompra[]>('/inventario/ordenes-compra'),
  createOrden: (dto: CreateOrdenCompraDto) => apiFetch<OrdenCompra>('/inventario/ordenes-compra', { method: 'POST', body: json(dto) }),
  recibirOrden: (id: string, dto: RecibirOrdenCompraDto) =>
    apiFetch<OrdenCompra>(`/inventario/ordenes-compra/${id}/recibir`, { method: 'PATCH', body: json(dto) }),
  cancelarOrden: (id: string) => apiFetch<OrdenCompra>(`/inventario/ordenes-compra/${id}/cancelar`, { method: 'PATCH' }),

  /** No hay endpoint de variantes sueltas: listado de prendas + detalle de cada una (igual que la web). */
  async getVariantes(): Promise<VarianteConProducto[]> {
    const productos = await catalogoAdminApi.getProductos();
    const detalles = await Promise.all(productos.map((p) => catalogoAdminApi.getProducto(p.id)));
    return aplanarVariantes(detalles);
  },
};
