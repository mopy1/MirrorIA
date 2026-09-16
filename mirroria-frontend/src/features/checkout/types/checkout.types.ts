// Espejo de VentaResponseDto en mirroria-backend/src/modules/ventas

export interface VentaItem {
  id: string
  varianteId: string
  cantidad: number
  precioUnitCents: number
  subtotalCents: number
}

export interface Venta {
  id: string
  clienteId: string | null
  sucursalId: string
  cajeroId: string | null
  reservaId: string | null
  cuponId: string | null
  canal: string
  estado: string
  numeroComprobante: string | null
  subtotalCents: number
  descuentoCents: number
  totalCents: number
  createdAt: string
  items: VentaItem[]
}
