import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class ProbadorNoConfiguradoException extends BusinessException {
  constructor() {
    super(
      'El probador virtual no esta configurado todavia (falta DECART_API_KEY).',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
