import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/**
 * Sin claves de Stripe, el cobro con tarjeta no esta disponible — pero el cobro
 * manual (QR y efectivo) sigue funcionando. Mismo criterio que el modulo `ia`:
 * el sistema se puede demostrar sin credenciales externas.
 */
export class PasarelaNoConfiguradaException extends BusinessException {
  constructor() {
    super(
      'El cobro con tarjeta no esta configurado en este servidor. ' +
        'Se puede pagar por QR o en efectivo al retirar.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
