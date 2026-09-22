import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

export class ConsultaNoComprendidaException extends BusinessException {
  constructor(textoOriginal: string) {
    super(
      `"${textoOriginal}" no es una pregunta de negocio que pueda responder todavía. ` +
        'Soy un asistente de reportes: preguntame sobre ventas, inventario, reservas, ' +
        'cupones, compras, usuarios, productos, sucursales o proveedores. Por ejemplo: ' +
        '"¿Cuánto vendí este mes?" o "¿Cuántos productos tengo en el catálogo?".',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
