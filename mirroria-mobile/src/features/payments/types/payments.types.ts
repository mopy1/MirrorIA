export type MetodoPagoManual = 'EFECTIVO';

export interface InstruccionesResponseDto {
  pagoId: string;
  metodo: string;
  montoCents: number;
  referencia: string;
  instrucciones: string;
}

export interface SesionTarjetaResponse {
  url: string;
}

export type EstadoCobroQr = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

/** Espejo de CobroQrResponseDto: el QR de UNA compra, con su monto. */
export interface CobroQrResponseDto {
  pagoId: string;
  ventaId: string;
  montoCents: number;
  comercio: string;
  referencia: string;
  /** PNG como data URL: <Image source={{ uri }}> lo muestra directo. */
  qrImagen: string;
  qrContenido: string;
  estado: EstadoCobroQr;
}

/** Espejo de EstadoCobroQrResponseDto: lo que se consulta mientras se espera. */
export interface EstadoCobroQrResponseDto {
  pagoId: string;
  ventaId: string;
  estado: EstadoCobroQr;
  montoCents: number;
  transaccion: string | null;
  pagadoEn: string | null;
}
