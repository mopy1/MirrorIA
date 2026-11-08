import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/** 403: la tienda existe pero está suspendida o su suscripción venció. */
export class TiendaNoDisponibleException extends BusinessException {
  constructor() {
    super(
      { message: 'Esta tienda no está disponible por el momento', codigo: 'TIENDA_NO_DISPONIBLE' },
      HttpStatus.FORBIDDEN,
    );
  }
}
