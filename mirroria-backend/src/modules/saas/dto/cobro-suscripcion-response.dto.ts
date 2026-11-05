import type { EstadoCobroSuscripcion } from '../entities/cobro-suscripcion.entity.js';

export class CobroSuscripcionResponseDto {
  cobroId!: string;
  pasarela!: string;
  modo!: 'REDIRECT' | 'QR' | 'INSTRUCCIONES';
  montoCents!: number;
  url?: string;
  qrBase64?: string;
  token?: string;
  expiraEn?: string;
  instrucciones?: string;
}

export class EstadoCobroSuscripcionResponseDto {
  cobroId!: string;
  estado!: EstadoCobroSuscripcion;
  pagado!: boolean;
  pagadoEn?: string;
}
