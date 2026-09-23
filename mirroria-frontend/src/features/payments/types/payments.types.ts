// Espejo de los DTO de pagos en mirroria-backend/src/modules/pagos

export type MetodoPago = "TARJETA" | "EFECTIVO"

export interface Instrucciones {
  pagoId: string
  metodo: MetodoPago
  montoCents: number
  /** Lo que la clienta le dice al cajero para que encuentre su compra. */
  referencia: string
  instrucciones: string
}

export interface Pago {
  id: string
  ventaId: string
  proveedorPago: string
  metodo: MetodoPago
  montoCents: number
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "REEMBOLSADO"
  referenciaExterna: string | null
  createdAt: string
}
