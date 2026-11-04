import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/**
 * 400 de negocio: el pedido está bien formado pero sus datos no tienen
 * sentido (ej. la misma variante dos veces en una orden de compra, recibir
 * más de lo pendiente, una fecha esperada en el pasado).
 */
export class SolicitudInvalidaException extends BusinessException {
  constructor(mensaje: string) {
    super(mensaje, HttpStatus.BAD_REQUEST);
  }
}
