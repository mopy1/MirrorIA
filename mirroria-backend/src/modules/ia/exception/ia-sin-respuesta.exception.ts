import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class IaSinRespuestaException extends BusinessException {
  constructor(segundos: number) {
    super(
      `El asistente de IA no respondió en ${segundos} s. Probá de nuevo en un momento.`,
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}
