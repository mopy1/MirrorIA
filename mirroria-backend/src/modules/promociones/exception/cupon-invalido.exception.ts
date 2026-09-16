import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class CuponInvalidoException extends BusinessException {
  constructor(motivo: string) {
    super(motivo, HttpStatus.BAD_REQUEST);
  }
}
