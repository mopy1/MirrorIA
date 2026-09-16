import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception.js';

export class StockInsuficienteException extends BusinessException {
  constructor(varianteId: string, sucursalId: string, disponible: number, solicitado: number) {
    super(
      `Stock insuficiente para la variante ${varianteId} en la sucursal ${sucursalId}: ` +
        `disponible ${disponible}, solicitado ${solicitado}`,
      HttpStatus.CONFLICT,
    );
  }
}
