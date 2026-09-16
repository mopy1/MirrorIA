import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export class RecursoDuplicadoException extends BusinessException {
  constructor(mensaje: string) {
    super(mensaje, HttpStatus.CONFLICT);
  }
}
