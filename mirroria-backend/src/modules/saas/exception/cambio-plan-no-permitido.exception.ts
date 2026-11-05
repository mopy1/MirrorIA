import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class CambioPlanNoPermitidoException extends BusinessException {
  constructor() {
    super('El cambio de plan con cobro llega con las pasarelas de pago', HttpStatus.CONFLICT);
  }
}
