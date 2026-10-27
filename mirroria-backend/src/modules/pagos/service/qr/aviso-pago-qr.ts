/** El cuerpo del aviso que el banco le manda al comercio cuando se paga un QR. */
export interface AvisoPagoQr {
  /** Identificador del aviso. Un aviso repetido no acredita dos veces. */
  id: string;
  tipo: 'cobro_qr.pagado';
  /** El token del QR: el comercio lo genero y viaja dentro de la URL escaneada. */
  token: string;
  transaccion: string;
  montoCents: number;
  pagadoEn: string;
}
