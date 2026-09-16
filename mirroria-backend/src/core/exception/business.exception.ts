import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base de toda excepción de negocio del dominio. Cada módulo debe extender
 * de esta clase (no lanzar HttpException genérica directo desde un service),
 * mismo criterio que `BusinessException` en erp-backend/case-backend.
 */
export abstract class BusinessException extends HttpException {
  protected constructor(message: string, status: HttpStatus) {
    super(message, status);
  }
}
