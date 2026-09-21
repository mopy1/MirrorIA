import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../core/exception/business.exception.js';

/**
 * Un ENCARGADO_SUCURSAL sin `sucursal_id` es una cuenta mal configurada: no hay
 * forma de acotarle el alcance. Se corta con 403 en vez de dejar el filtro vacio,
 * porque sin filtro el reporte devolveria TODAS las sucursales.
 */
export class SinSucursalAsignadaException extends BusinessException {
  constructor() {
    super(
      'Tu cuenta no tiene una sucursal asignada, asi que no se puede acotar el reporte. ' +
        'Pedile a un administrador que te asigne una.',
      HttpStatus.FORBIDDEN,
    );
  }
}
