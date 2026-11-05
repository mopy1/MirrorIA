import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/**
 * Excepción HTTP 503 Service Unavailable cuando una pasarela no está configurada,
 * se encuentra en desarrollo o no soporta el contexto solicitado.
 */
export class PasarelaNoConfiguradaException extends BusinessException {
  constructor(mensaje?: string) {
    super(
      mensaje ??
        'El cobro con tarjeta no esta configurado en este servidor. ' +
        'Se puede pagar por QR o en efectivo al retirar.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
