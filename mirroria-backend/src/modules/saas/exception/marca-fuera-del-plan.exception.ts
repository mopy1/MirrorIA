import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/** 409: el plan no incluye esa personalización. El mensaje nombra "plan" (FE6: "Ver mi plan"). */
export class MarcaFueraDelPlanException extends BusinessException {
  constructor(plan: string, que: string) {
    super(`Tu plan ${plan} no incluye ${que}. Mejorá tu plan para usarlo.`, HttpStatus.CONFLICT);
  }
}
