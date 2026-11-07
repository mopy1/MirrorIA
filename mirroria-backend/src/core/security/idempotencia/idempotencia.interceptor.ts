import {
  type CallHandler,
  ConflictException,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import type { JwtPayload } from '../jwt-payload.interface.js';
import { tenantOpcional } from '../../tenancy/tenant-context.js';
import { EstadoIdempotencia, type Idempotencia } from './entities/idempotencia.entity.js';
import { calcularHashCuerpo } from './idempotencia.hash.js';
import { IdempotenciaService } from './idempotencia.service.js';

const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// H4: `codigo` para que web y móvil distingan este 409 (reintentar más tarde)
// del de stock (`STOCK_AGOTADO_CONFLICTO`) sin leer el texto.
const enCurso = () =>
  new ConflictException({
    message: 'Existe una operación en curso con esta misma clave de idempotencia. Espere a que finalice.',
    codigo: 'IDEMPOTENCIA_EN_CURSO',
  });

@Injectable()
export class IdempotenciaInterceptor implements NestInterceptor {
  constructor(private readonly idempotenciaService: IdempotenciaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const rawClave =
      req.headers['idempotency-key'] ?? req.headers['x-idempotency-key'];

    if (!rawClave || typeof rawClave !== 'string') {
      return next.handle();
    }

    const clave = rawClave.trim();
    if (clave === '') {
      return next.handle();
    }

    const metodo = req.method ? req.method.toUpperCase() : 'POST';
    if (!METODOS_MUTANTES.has(metodo)) {
      return next.handle();
    }

    let tenantId = tenantOpcional();
    if (!tenantId) {
      const user = req.user as JwtPayload | undefined;
      if (user?.tenantId) {
        tenantId = user.tenantId;
      }
    }

    if (!tenantId) {
      // Sin tenant disponible: la petición continúa sin persistencia de idempotencia multi-tenant
      return next.handle();
    }

    const ruta = (req.originalUrl || req.url || req.path || '').split('?')[0];
    const hashCuerpo = calcularHashCuerpo(req.body);

    const existente = await this.idempotenciaService.buscar(tenantId, clave);

    let registro: Idempotencia;

    if (existente) {
      if (!this.idempotenciaService.validarHash(existente, hashCuerpo)) {
        throw new UnprocessableEntityException(
          'El cuerpo de la solicitud no coincide con la clave de idempotencia suministrada.',
        );
      }

      if (existente.estado === EstadoIdempotencia.EN_PROCESO) {
        throw enCurso();
      }

      if (existente.estado === EstadoIdempotencia.COMPLETADO) {
        if (typeof res.setHeader === 'function') {
          res.setHeader('X-Cache-Idempotency', 'HIT');
        }
        const codigo = existente.codigoEstado ?? HttpStatus.OK;
        if (typeof res.status === 'function') {
          res.status(codigo);
        } else {
          res.statusCode = codigo;
        }
        return of(existente.cuerpoRespuesta);
      }

      // Estado FALLIDO: reiniciamos el registro a EN_PROCESO para permitir el reintento
      registro = await this.idempotenciaService.reiniciarIntento(
        existente.id,
        hashCuerpo,
        ruta,
        metodo,
      );
    } else {
      try {
        registro = await this.idempotenciaService.registrarIntento({
          tenantId,
          clave,
          ruta,
          metodo,
          hashCuerpo,
        });
      } catch (err: unknown) {
        const pgCode =
          (err as { code?: string; driverError?: { code?: string } })?.driverError
            ?.code ?? (err as { code?: string })?.code;
        if (pgCode === '23505') {
          throw enCurso();
        }
        throw err;
      }
    }

    return next.handle().pipe(
      switchMap(async (data) => {
        if (typeof res.setHeader === 'function') {
          res.setHeader('X-Cache-Idempotency', 'MISS');
        }
        const statusCode = res.statusCode || 200;
        await this.idempotenciaService.marcarCompletado(
          registro.id,
          statusCode,
          data ?? null,
        );
        return data;
      }),
      catchError(async (err) => {
        try {
          const statusCode =
            err instanceof HttpException ? err.getStatus() : 500;
          const response =
            err instanceof HttpException
              ? err.getResponse()
              : { message: err?.message };
          const cuerpo =
            typeof response === 'object' && response !== null
              ? (response as Record<string, unknown>)
              : { message: String(response) };

          await this.idempotenciaService.marcarFallido(
            registro.id,
            statusCode,
            cuerpo,
          );
        } catch {
          // Evitamos ocultar la excepción original
        }
        throw err;
      }),
    );
  }
}
