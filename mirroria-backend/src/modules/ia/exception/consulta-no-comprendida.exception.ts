import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class ConsultaNoComprendidaException extends BusinessException {
  constructor(textoOriginal: string) {
    super(
      `No se pudo interpretar la consulta: "${textoOriginal}". Probá preguntarlo de otra forma.`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
