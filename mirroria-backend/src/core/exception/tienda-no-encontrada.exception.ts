import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export class TiendaNoEncontradaException extends BusinessException {
  constructor(slug: string) {
    super(`No existe la tienda "${slug}"`, HttpStatus.NOT_FOUND);
  }
}
