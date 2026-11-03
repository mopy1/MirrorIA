import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class LimiteTokensProbadorException extends BusinessException {
  constructor() {
    super(
      'Pediste demasiados tokens del probador. Esperá unos minutos y volvé a intentar.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
