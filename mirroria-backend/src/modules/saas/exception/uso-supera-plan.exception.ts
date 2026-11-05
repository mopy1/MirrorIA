import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/** 409 al bajar de plan: lo que la tienda ya usa no entra en el plan nuevo. */
export class UsoSuperaPlanException extends BusinessException {
  constructor(uso: number, recurso: string, plan: string) {
    super(
      `Tu uso actual (${uso} ${recurso}) supera el límite del plan ${plan}. Desactivá lo que sobra antes de cambiar.`,
      HttpStatus.CONFLICT,
    );
  }
}
