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
  }): Promise<SesionPago>;
  /**
   * La sesion ya creada, si todavia se puede pagar con ella. Devuelve null si
   * caduco, si ya se completo o si la pasarela no la reconoce — en ese caso hay
   * que crear una nueva. Sirve para que un segundo intento sobre la misma venta
   * mande a la clienta a la MISMA sesion en vez de abrir otra.
   */
  recuperarSesion(sesionId: string): Promise<SesionPago | null>;
  /**
   * Verifica la firma del webhook contra el cuerpo CRUDO y devuelve el evento.
   * Si la firma no valida, lanza. Nunca devuelve un evento sin verificar.
   */
  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago;
}
