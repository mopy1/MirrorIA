import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Errores de Postgres que son culpa del pedido, no del servidor. El mensaje es
// fijo a propósito: el `detail` de Postgres trae nombres de tabla/constraint.
const ERRORES_POSTGRES: Record<string, { status: HttpStatus; message: string }> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'Ya existe un registro con esos datos' },
  '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Identificador inválido' },
};

/**
 * Formato de error único para toda la API, mismo shape que erp-backend/case-backend
 * para que el frontend (React) maneje errores igual sin importar el backend:
 * { status, message, timestamp }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const pg =
      exception instanceof QueryFailedError
        ? ERRORES_POSTGRES[(exception.driverError as { code?: string } | undefined)?.code ?? '']
        : undefined;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (pg?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : (pg?.message ?? 'Error interno del servidor');

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    const rawBody = exception instanceof HttpException ? exception.getResponse() : null;
    const extra: Record<string, unknown> =
      typeof rawBody === 'object' && rawBody !== null && !Array.isArray(rawBody)
        ? { ...(rawBody as Record<string, unknown>) }
        : {};
    delete extra.statusCode;
    delete extra.message;

    response.status(status).json({
      status,
      message,
      ...extra,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(exception: HttpException): string | string[] {
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      return (body as { message: string | string[] }).message;
    }
    return exception.message;
  }
}
