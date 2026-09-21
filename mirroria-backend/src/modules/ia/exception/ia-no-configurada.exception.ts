import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class IaNoConfiguradaException extends BusinessException {
  constructor() {
    super(
      'El asistente de reportes no esta configurado (falta IA_API_KEY). ' +
        'Se puede usar POST /ia/reportes/consulta con una ficha armada a mano.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
