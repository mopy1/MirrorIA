import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/**
 * El webhook no lleva JWT — la pasarela no puede autenticarse con uno — asi que
 * la firma es su UNICA defensa. Sin verificarla, cualquiera que descubra la URL
 * puede marcar ventas como pagadas.
 */
export class FirmaWebhookInvalidaException extends BusinessException {
  constructor() {
    super('La firma del webhook no es valida', HttpStatus.BAD_REQUEST);
  }
}
