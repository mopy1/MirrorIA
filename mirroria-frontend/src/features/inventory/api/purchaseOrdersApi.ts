import { apiFetch } from "@/lib/api"
import type {
  CreateOrdenCompraDto,
  OrdenCompra,
  RecibirOrdenCompraDto,
} from "../types/purchase-orders.types"

export const purchaseOrdersApi = {
  getOrdenes: () => apiFetch<OrdenCompra[]>("/inventario/ordenes-compra"),

  getOrdenById: (id: string) =>
    apiFetch<OrdenCompra>(`/inventario/ordenes-compra/${id}`),

  createOrden: (dto: CreateOrdenCompraDto) =>
    apiFetch<OrdenCompra>("/inventario/ordenes-compra", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  recibirOrden: (id: string, dto: RecibirOrdenCompraDto) =>
    apiFetch<OrdenCompra>(`/inventario/ordenes-compra/${id}/recibir`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  cancelarOrden: (id: string) =>
    apiFetch<OrdenCompra>(`/inventario/ordenes-compra/${id}/cancelar`, { method: "PATCH" }),
}
