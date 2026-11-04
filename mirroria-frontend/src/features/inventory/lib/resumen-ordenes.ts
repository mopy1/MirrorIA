import type { OrdenCompra } from "../types/purchase-orders.types"

export interface ResumenOrdenesProveedor {
  abiertas: number
  unidadesEnTransito: number
}

/** Por proveedor: órdenes que esperan mercadería y unidades que faltan
 * recibir (lo que esas órdenes tienen en tránsito). Cálculo en cliente
 * sobre GET /inventario/ordenes-compra, sin endpoint nuevo. */
export function resumenPorProveedor(ordenes: OrdenCompra[]): Map<string, ResumenOrdenesProveedor> {
  const mapa = new Map<string, ResumenOrdenesProveedor>()
  for (const o of ordenes) {
    if (o.estado !== "PENDIENTE" && o.estado !== "RECIBIDA_PARCIAL") continue
    const actual = mapa.get(o.proveedorId) ?? { abiertas: 0, unidadesEnTransito: 0 }
    actual.abiertas += 1
    actual.unidadesEnTransito += o.items.reduce((a, i) => a + i.cantidadPedida - i.cantidadRecibida, 0)
    mapa.set(o.proveedorId, actual)
  }
  return mapa
}
