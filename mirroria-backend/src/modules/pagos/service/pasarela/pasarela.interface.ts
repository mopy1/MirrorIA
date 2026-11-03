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
  /**
   * La sesion ya creada, si todavia se puede pagar con ella. Devuelve null si
   * caduco, si ya se completo o si la pasarela no la reconoce — en ese caso hay
   * que crear una nueva. Sirve para que un segundo intento sobre la misma venta
   * mande a la clienta a la MISMA sesion en vez de abrir otra. 'completa' si ya
   * se pago (el webhook esta en camino): NO hay que abrir otra.
   */
  recuperarSesion(sesionId: string): Promise<SesionPago | 'completa' | null>;
  /**
   * Cierra una sesion para que ya no se pueda pagar con ella (la clienta
   * cancelo la compra). true si quedo cerrada o ya lo estaba; false si ya se
   * completo (pudo haberse cobrado) o no se pudo confirmar: en ese caso NO se
   * cancela la venta, el webhook o la expiracion deciden.
   */
  cerrarSesion(sesionId: string): Promise<boolean>;
  /**
   * Verifica la firma del webhook contra el cuerpo CRUDO y devuelve el evento.
   * Si la firma no valida, lanza. Nunca devuelve un evento sin verificar.
   */
  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago;
}
