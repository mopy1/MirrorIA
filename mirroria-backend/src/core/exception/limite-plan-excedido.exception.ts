import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/** 409: crear/reactivar el recurso pasaría el tope del plan de la tienda. */
export class LimitePlanExcedidoException extends BusinessException {
  constructor(planNombre: string, limite: number, recurso: string) {
    super(
      `Tu plan ${planNombre} permite hasta ${limite} ${recurso}. Mejorá tu plan para agregar más.`,
      HttpStatus.CONFLICT,
    );
  }
}
