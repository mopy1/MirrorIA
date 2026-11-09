// Espejo de `GET /pagos/pasarelas` (igual que la web: payments/types/pasarelas.types.ts).
export type PasarelaId = 'STRIPE' | 'WAYRA' | 'PAYPAL' | 'QR_BANCARIO' | 'MANUAL';
export type TipoPasarela = 'TARJETA' | 'QR' | 'BILLETERA' | 'EFECTIVO';
export type EstadoPasarela = 'DISPONIBLE' | 'EN_DESARROLLO' | 'NO_CONFIGURADA';
export type IconoPasarela = 'credit-card' | 'qr-code' | 'paypal-logo' | 'money';
export type ContextoPasarela = 'checkout' | 'suscripcion';

export interface PasarelaMetadata {
  id: PasarelaId;
  nombre: string;
  descripcion: string;
  tipo: TipoPasarela;
  estado: EstadoPasarela;
  soportaCheckout: boolean;
  soportaSuscripcion: boolean;
  icono: IconoPasarela;
  monedas: ('BOB' | 'USD')[];
}
