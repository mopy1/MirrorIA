import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/** Se escaneo un QR que ya no acepta pagos: ya se pago o su compra vencio. */
export class CobroQrNoPagableException extends BusinessException {
  constructor(detalle: string) {
    super(`Este QR no se puede pagar: ${detalle}`, HttpStatus.CONFLICT);
  }
}
