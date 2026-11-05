import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/** 409: el slug está reservado o ya lo tomó otra tienda. */
export class SlugNoDisponibleException extends BusinessException {
  constructor(slug: string, motivo: 'reservada' | 'ocupada') {
    super(`La dirección "${slug}" no está disponible (${motivo})`, HttpStatus.CONFLICT);
  }
}
