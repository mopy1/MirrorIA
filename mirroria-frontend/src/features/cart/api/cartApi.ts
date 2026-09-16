import { apiFetch } from "@/lib/api"
import type { Carrito } from "../types/cart.types"

export const cartApi = {
  getCarrito: (usuarioId: string) => apiFetch<Carrito>(`/ventas/carrito/${usuarioId}`),

  addItem: (usuarioId: string, varianteId: string, cantidad: number) =>
    apiFetch<Carrito>(`/ventas/carrito/${usuarioId}/items`, {
      method: "POST",
      body: JSON.stringify({ varianteId, cantidad }),
    }),

  removeItem: (usuarioId: string, varianteId: string) =>
    apiFetch<Carrito>(`/ventas/carrito/${usuarioId}/items/${varianteId}`, {
      method: "DELETE",
    }),
}
