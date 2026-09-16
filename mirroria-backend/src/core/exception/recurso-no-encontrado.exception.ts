import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export class RecursoNoEncontradoException extends BusinessException {
  constructor(recurso: string, identificador?: string | number) {
    const detalle = identificador !== undefined ? ` (${identificador})` : '';
    super(`${recurso}${detalle} no encontrado`, HttpStatus.NOT_FOUND);
  }
}
