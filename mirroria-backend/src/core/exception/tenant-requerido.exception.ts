import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

/** 400: la ruta opera datos de una tienda y el pedido no dijo cuál (ni JWT ni X-Tenant). */
export class TenantRequeridoException extends BusinessException {
  constructor() {
    super('Falta indicar la tienda (cabecera X-Tenant)', HttpStatus.BAD_REQUEST);
  }
}
