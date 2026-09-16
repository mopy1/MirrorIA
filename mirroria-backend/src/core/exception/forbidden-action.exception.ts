import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/**
 * Para reglas de "dueño del recurso" a nivel de dominio (ej. un cliente
 * intentando cancelar la reserva de otro) — distinto de un rol insuficiente
 * (eso ya lo cubre RolesGuard con su propio 403 genérico "Forbidden resource").
 */
export class ForbiddenActionException extends BusinessException {
  constructor(mensaje: string) {
    super(mensaje, HttpStatus.FORBIDDEN);
  }
}
