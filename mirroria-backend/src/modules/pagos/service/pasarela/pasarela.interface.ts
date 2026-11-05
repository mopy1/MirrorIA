export type PasarelaId = 'STRIPE' | 'WAYRA' | 'PAYPAL' | 'QR_BANCARIO' | 'MANUAL';
export type TipoPasarela = 'TARJETA' | 'QR' | 'BILLETERA' | 'EFECTIVO';
export type EstadoPasarela = 'DISPONIBLE' | 'EN_DESARROLLO' | 'NO_CONFIGURADA';
export type IconoPasarela = 'credit-card' | 'qr-code' | 'paypal-logo' | 'money';

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

export interface IniciarCobroParams {
  montoCents: number;
  moneda: 'BOB' | 'USD';
  descripcion: string;
  referencia: string; // ej. ventaId o cobroSuscripcionId
  contexto: 'checkout' | 'suscripcion';
  nombreComercio: string; // Nombre real de la tienda
  urlExito: string;
  urlCancelacion: string;
  expiraEn?: Date;
  metadata?: Record<string, string>;
}

export interface IniciarCobroResultado {
  modo: 'REDIRECT' | 'QR' | 'INSTRUCCIONES';
  url?: string;            // Para Stripe / PayPal
  qrBase64?: string;       // Imagen del QR para Wayra / QR Bancario
  qrTexto?: string;        // Payload del QR para apps bancarias
  token?: string;          // Token de sesión o transacción
  instrucciones?: string;  // Glosa para efectivo en sucursal
  expiraEn?: Date;
}

export interface EventoNotificacionVerificado {
  id: string; // event_id para idempotencia
  tipo: 'PAGO_APROBADO' | 'PAGO_FALLIDO' | 'OTRO';
  referenciaExterna: string; // sesionId o token
  montoCents?: number;
}

export interface IPasarelaProveedor {
  readonly id: PasarelaId;
  readonly metadata: PasarelaMetadata;

  estaConfigurada(): boolean;
  iniciarCobro(params: IniciarCobroParams): Promise<IniciarCobroResultado>;
  verificarNotificacion(
    cuerpoCrudo: Buffer,
    cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado>;
}

// -------------------------------------------------------------
// Interfaces históricas / legadas para compatibilidad con Ventas B2C
// -------------------------------------------------------------
export const PASARELA = Symbol('PASARELA');

export interface SesionPago {
  /** Identificador de la sesion en la pasarela. */
  id: string;
  /** A donde mandar a la clienta para que pague. */
  url: string;
}

export interface EventoPago {
  /** Identificador del evento. Es la clave de la idempotencia. */
  id: string;
  tipo: 'pagado' | 'otro';
  /** La sesion a la que corresponde, si el evento la trae. */
  sesionId: string | null;
}

export interface Pasarela {
  estaConfigurada(): boolean;
  crearSesion(params: {
    montoCents: number;
    descripcion: string;
    referencia: string;
    urlExito: string;
    urlCancelacion: string;
    /** Cuando deja de aceptar pagos (alineado al vencimiento de la venta). */
    expiraEn?: Date;
  }): Promise<SesionPago>;
  recuperarSesion(sesionId: string): Promise<SesionPago | 'completa' | null>;
  cerrarSesion(sesionId: string): Promise<boolean>;
  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago;
}
