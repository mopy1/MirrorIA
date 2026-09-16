import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/**
 * Catch-all para violaciones de reglas de negocio que no son "no encontrado"
 * ni "duplicado" — típicamente transiciones de estado inválidas (ej. recibir
 * una orden de compra ya CANCELADA, cobrar una venta ya CANCELADA).
 */
export class OperacionInvalidaException extends BusinessException {
  constructor(mensaje: string) {
    super(mensaje, HttpStatus.CONFLICT);
  }
}
