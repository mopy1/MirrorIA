import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class VentaNoPagableException extends BusinessException {
  constructor(detalle: string) {
    super(`No se puede cobrar esta venta: ${detalle}`, HttpStatus.CONFLICT);
  }
}
