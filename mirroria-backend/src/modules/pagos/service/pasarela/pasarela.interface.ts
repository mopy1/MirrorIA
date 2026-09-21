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
   * Verifica la firma del webhook contra el cuerpo CRUDO y devuelve el evento.
   * Si la firma no valida, lanza. Nunca devuelve un evento sin verificar.
   */
  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago;
}
