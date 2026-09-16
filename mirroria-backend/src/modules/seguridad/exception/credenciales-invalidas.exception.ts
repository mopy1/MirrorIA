import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class CredencialesInvalidasException extends BusinessException {
  constructor() {
    super('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);
  }
}
