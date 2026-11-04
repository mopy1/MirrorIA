export type EstadoPedido =
  | "PENDIENTE"
  | "PAGADA"
  | "ENTREGADA"
  | "CANCELADA"
  | "DEVUELTA_TOTAL"
  | "DEVUELTA_PARCIAL"

export interface PedidoItem {
  id: string
  varianteId: string
  cantidad: number
  precioUnitCents: number
  subtotalCents: number
}

export interface Pedido {
  id: string
  clienteId: string | null
  sucursalId: string
  cajeroId: string | null
  reservaId: string | null
  cuponId: string | null
  canal: string
  estado: EstadoPedido
  numeroComprobante: string | null
  subtotalCents: number
  descuentoCents: number
  totalCents: number
  createdAt: string
  items: PedidoItem[]
}
