import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export class DemasiadosPedidosException extends BusinessException {
  constructor() {
    super('Demasiados intentos. Esperá unos minutos y volvé a intentar.', HttpStatus.TOO_MANY_REQUESTS);
  }
}
