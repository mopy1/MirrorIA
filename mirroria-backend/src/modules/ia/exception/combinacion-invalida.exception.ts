import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class CombinacionInvalidaException extends BusinessException {
  constructor(detalle: string) {
    super(`Combinacion invalida: ${detalle}`, HttpStatus.BAD_REQUEST);
  }
}
