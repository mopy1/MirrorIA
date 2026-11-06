import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor para endpoints de Machine Learning.
 * Inyecta la cabecera HTTP `X-ML-Fallback: true | false` en base a la bandera
 * `fallback` calculada por MlService al detectar si el microservicio Python está activo u offline.
 */
@Injectable()
export class MlFallbackInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'fallback' in data) {
          const fallback = Boolean((data as { fallback?: boolean }).fallback);
          response.setHeader('X-ML-Fallback', String(fallback));
        }
        return data;
      }),
    );
  }
}
