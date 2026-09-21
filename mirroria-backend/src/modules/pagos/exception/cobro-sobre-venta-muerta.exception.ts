import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/**
 * El cajero ya recibio la plata, pero la venta dejo de ser cobrable (la
 * expiracion la cancelo mientras el tenia la pantalla abierta, y su stock ya
 * volvio al inventario).
 *
 * El pago queda guardado y marcado para reembolso — la constancia de que entro
 * dinero no se puede perder —, y este error existe para que la persona que
 * esta del otro lado del mostrador se entere de que tiene que devolverlo. Es la
 * diferencia deliberada con el webhook: alla no hay nadie esperando y devolver
 * un error solo provocaria reintentos; aca hay una clienta enfrente.
 */
export class CobroSobreVentaMuertaException extends BusinessException {
  constructor(pagoId: string, detalle: string) {
    super(
      `El dinero ya recibido quedo registrado para reembolso (pago ${pagoId}): ` +
        `la venta ya no se puede cobrar (${detalle}). Devolvele el cobro a la clienta.`,
      HttpStatus.CONFLICT,
    );
  }
}
