export type MetodoPagoManual = 'QR' | 'EFECTIVO';

export interface InstruccionesResponseDto {
  pagoId: string;
  metodo: string;
  montoCents: number;
  referencia: string;
  qrUrl: string | null;
  instrucciones: string;
}

export interface SesionTarjetaResponse {
  url: string;
}
