import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { correrConContexto } from './tenant-context.js';
import { HEADER_TENANT } from './tenant.constants.js';

export function normalizarSlug(valor: unknown): string | null {
  const crudo = Array.isArray(valor) ? valor[0] : valor;
  if (typeof crudo !== 'string') return null;
  const slug = crudo.trim().toLowerCase();
  return slug.length > 0 ? slug : null;
}

/**
 * Abre el contexto del tenant de cada request (vacío, con la cabecera cruda).
 * Lo completa TenantInterceptor (modules/saas), que corre después de los guards.
 * Se aplica desde AppModule.configure, así los e2e que montan AppModule también lo tienen.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    correrConContexto(
      {
        headerSlug: normalizarSlug(req.headers[HEADER_TENANT]),
        tenantId: null,
        slug: null,
        nombre: null,
        planNombre: null,
        limites: null,
      },
      () => next(),
    );
  }
}
