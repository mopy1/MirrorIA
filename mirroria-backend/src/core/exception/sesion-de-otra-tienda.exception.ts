import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/** 403: la cabecera X-Tenant no coincide con la tienda del JWT (o es la cuenta de plataforma). */
export class SesionDeOtraTiendaException extends BusinessException {
  constructor(mensaje = 'Tu sesión pertenece a otra tienda') {
    super(mensaje, HttpStatus.FORBIDDEN);
  }
}
