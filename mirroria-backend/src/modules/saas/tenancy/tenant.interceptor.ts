import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { SesionDeOtraTiendaException } from '../../../core/exception/sesion-de-otra-tienda.exception.js';
import { TenantRequeridoException } from '../../../core/exception/tenant-requerido.exception.js';
import { TiendaNoDisponibleException } from '../../../core/exception/tienda-no-disponible.exception.js';
import { TiendaNoEncontradaException } from '../../../core/exception/tienda-no-encontrada.exception.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { PERMITIR_TIENDA_NO_DISPONIBLE } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SIN_TENANT } from '../../../core/tenancy/sin-tenant.decorator.js';
import { contextoTenant } from '../../../core/tenancy/tenant-context.js';
import { type InfoTenant, ResolverTenantService } from '../service/resolver-tenant.service.js';

/**
 * Completa el contexto de tienda del request (lo abrió TenantMiddleware). Corre
 * DESPUÉS de los guards, así `req.user` ya existe. Regla única (spec §2.3):
 * 1. Con JWT: la tienda es la del usuario (de la BD). X-Tenant distinto → 403;
 *    cuenta de plataforma con X-Tenant → 403.
 * 2. Sin JWT y con X-Tenant: se resuelve el slug (404 si no existe).
 * 3. Tienda no disponible → 403, salvo @PermitirTiendaNoDisponible().
 * 4. Sin tienda en una ruta sin @SinTenant() → 400.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: ResolverTenantService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();
    const store = contextoTenant();
    const user = context.switchToHttp().getRequest<Request>().user as JwtPayload | undefined;
    const marca = (clave: string) =>
      this.reflector.getAllAndOverride<boolean>(clave, [context.getHandler(), context.getClass()]) === true;
    const headerSlug = store?.headerSlug ?? null;

    let info: InfoTenant | null = null;
    if (user) {
      if (user.tenantId == null) {
        if (headerSlug) throw new SesionDeOtraTiendaException('La cuenta de plataforma no opera tiendas');
      } else {
        info = await this.resolver.porId(user.tenantId);
        if (headerSlug && info && headerSlug !== info.slug) throw new SesionDeOtraTiendaException();
      }
    } else if (headerSlug) {
      info = await this.resolver.porSlug(headerSlug);
      if (!info) throw new TiendaNoEncontradaException(headerSlug);
    }

    if (info) {
      if (store) {
        Object.assign(store, {
          tenantId: info.id,
          slug: info.slug,
          nombre: info.nombre,
          planNombre: info.planNombre,
          limites: info.limites,
        });
      }
      if (!info.disponible && !marca(PERMITIR_TIENDA_NO_DISPONIBLE)) throw new TiendaNoDisponibleException();
    } else if (!marca(SIN_TENANT)) {
      throw new TenantRequeridoException();
    }
    return next.handle();
  }
}
