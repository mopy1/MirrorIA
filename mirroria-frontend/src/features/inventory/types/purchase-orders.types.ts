export const EstadoOrdenCompra = {
  PENDIENTE: "PENDIENTE",
  EN_TRANSITO: "EN_TRANSITO",
  RECIBIDA_PARCIAL: "RECIBIDA_PARCIAL",
  RECIBIDA: "RECIBIDA",
  CANCELADA: "CANCELADA",
} as const

export type EstadoOrdenCompra = (typeof EstadoOrdenCompra)[keyof typeof EstadoOrdenCompra]

export interface OrdenCompraItem {
  varianteId: string
  cantidadPedida: number
  cantidadRecibida: number
}

export interface OrdenCompra {
  id: string
  proveedorId: string
  sucursalDestinoId: string
  usuarioId: string
  estado: EstadoOrdenCompra
  items: OrdenCompraItem[]
  fechaPedido: string
  fechaEsperada: string | null
  fechaRecepcion: string | null
}

export interface CreateOrdenCompraItemDto {
  varianteId: string
  cantidadPedida: number
}

export interface CreateOrdenCompraDto {
  proveedorId: string
  sucursalDestinoId: string
  usuarioId?: string
  items: CreateOrdenCompraItemDto[]
  fechaEsperada?: string
}

export interface RecepcionItemDto {
  varianteId: string
  cantidadRecibida: number
}

export interface RecibirOrdenCompraDto {
  items: RecepcionItemDto[]
}
