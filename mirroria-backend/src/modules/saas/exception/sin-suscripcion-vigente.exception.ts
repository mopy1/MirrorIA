import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class SinSuscripcionVigenteException extends BusinessException {
  constructor() {
    super('La tienda no tiene una suscripción vigente', HttpStatus.CONFLICT);
  }
}
