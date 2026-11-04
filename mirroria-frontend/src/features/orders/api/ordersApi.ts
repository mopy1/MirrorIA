import { apiFetch } from "@/lib/api"
import type { Pedido } from "../types/orders.types"

export const ordersApi = {
  getMisPedidos: () => apiFetch<Pedido[]>("/ventas/mias"),
  getPedidoById: (id: string) => apiFetch<Pedido>(`/ventas/${id}`),
}
