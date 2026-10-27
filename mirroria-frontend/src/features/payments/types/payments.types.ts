// Espejo de los DTO de pagos en mirroria-backend/src/modules/pagos

export type MetodoPago = "TARJETA" | "QR" | "EFECTIVO"

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

export type EstadoCobroQr = "PENDIENTE" | "PAGADO" | "VENCIDO"

/** Espejo de CobroQrResponseDto: el QR de UNA compra, con su monto. */
export interface CobroQr {
  pagoId: string
  ventaId: string
  montoCents: number
  comercio: string
  referencia: string
  /** PNG como data URL, listo para un <img>. */
  qrImagen: string
  /** La URL que abre la cámara del celular al escanear. */
  qrContenido: string
  estado: EstadoCobroQr
}

/** Espejo de EstadoCobroQrResponseDto: lo que se consulta mientras se espera. */
export interface EstadoCobroQrRespuesta {
  pagoId: string
  ventaId: string
  estado: EstadoCobroQr
  montoCents: number
  transaccion: string | null
  pagadoEn: string | null
}
