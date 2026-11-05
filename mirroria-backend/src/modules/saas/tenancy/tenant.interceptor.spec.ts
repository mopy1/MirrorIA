import { describe, expect, it, vi } from 'vitest';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { SesionDeOtraTiendaException } from '../../../core/exception/sesion-de-otra-tienda.exception.js';
import { TenantRequeridoException } from '../../../core/exception/tenant-requerido.exception.js';
import { TiendaNoDisponibleException } from '../../../core/exception/tienda-no-disponible.exception.js';
import { TiendaNoEncontradaException } from '../../../core/exception/tienda-no-encontrada.exception.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { PERMITIR_TIENDA_NO_DISPONIBLE } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SIN_TENANT } from '../../../core/tenancy/sin-tenant.decorator.js';
import { type ContextoTenant, contextoTenant, correrConContexto } from '../../../core/tenancy/tenant-context.js';
import type { InfoTenant, ResolverTenantService } from '../service/resolver-tenant.service.js';
import { TenantInterceptor } from './tenant.interceptor.js';

const A: InfoTenant = {
  id: 'id-a', slug: 'tienda-a', nombre: 'A', disponible: true, planNombre: 'Básico',
  limites: { maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3 },
};
const B: InfoTenant = { ...A, id: 'id-b', slug: 'tienda-b', nombre: 'B' };
const resolver = {
  porId: vi.fn(async (id: string) => [A, B].find((t) => t.id === id) ?? null),
  porSlug: vi.fn(async (slug: string) => [A, B].find((t) => t.slug === slug) ?? null),
} as unknown as ResolverTenantService;

function usuario(tenantId: string | null, role = 'ADMIN'): JwtPayload {
  return { sub: 'u', email: 'u@x.com', role, sucursalId: null, tenantId };
}

/** Corre el interceptor con un contexto como el que abre el middleware. */
async function correr(opts: {
  header?: string;
  user?: JwtPayload;
  marcas?: string[];
  info?: (t: InfoTenant) => InfoTenant;
}): Promise<ContextoTenant> {
  const marcas = new Set(opts.marcas ?? []);
  const reflector = { getAllAndOverride: (k: string) => marcas.has(k) } as unknown as Reflector;
  const res = opts.info
    ? ({
        porId: async (id: string) => opts.info!((await resolver.porId(id))!),
        porSlug: async (s: string) => {
          const t = await resolver.porSlug(s);
          return t && opts.info!(t);
        },
      } as unknown as ResolverTenantService)
    : resolver;
  const interceptor = new TenantInterceptor(reflector, res);
  const ctx = {
    getType: () => 'http',
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user: opts.user }) }),
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(contextoTenant()) };
  const store: ContextoTenant = {
    headerSlug: opts.header ?? null, tenantId: null, slug: null, nombre: null, planNombre: null, limites: null,
  };
  return correrConContexto(store, async () => {
    await interceptor.intercept(ctx, next);
    return { ...store };
  });
}

describe('TenantInterceptor (regla única de la tienda del request)', () => {
  it('1) JWT de A sin cabecera → la tienda es A (con plan y límites en el contexto)', async () => {
    const ctx = await correr({ user: usuario('id-a') });
    expect(ctx).toMatchObject({ tenantId: 'id-a', slug: 'tienda-a', planNombre: 'Básico' });
    expect(ctx.limites?.maxSucursales).toBe(1);
  });

  it('2) JWT de A + X-Tenant de B → 403 "Tu sesión pertenece a otra tienda"', async () => {
    await expect(correr({ user: usuario('id-a'), header: 'tienda-b' })).rejects.toThrow(SesionDeOtraTiendaException);
    await expect(correr({ user: usuario('id-a'), header: 'tienda-a' })).resolves.toMatchObject({ tenantId: 'id-a' });
  });

  it('3) cuenta de plataforma con X-Tenant → 403; sin cabecera en ruta @SinTenant → pasa sin tienda', async () => {
    await expect(correr({ user: usuario(null, 'DUENO_PLATAFORMA'), header: 'tienda-a' })).rejects.toThrow(
      'La cuenta de plataforma no opera tiendas',
    );
    const ctx = await correr({ user: usuario(null, 'DUENO_PLATAFORMA'), marcas: [SIN_TENANT] });
    expect(ctx.tenantId).toBeNull();
  });

  it('4) sin JWT: X-Tenant resuelve el slug; uno que no existe → 404', async () => {
    expect((await correr({ header: 'tienda-b' })).tenantId).toBe('id-b');
    await expect(correr({ header: 'no-existe' })).rejects.toThrow(TiendaNoEncontradaException);
  });

  it('5) tienda no disponible → 403, salvo @PermitirTiendaNoDisponible', async () => {
    const info = (t: InfoTenant) => ({ ...t, disponible: false });
    await expect(correr({ header: 'tienda-a', info })).rejects.toThrow(TiendaNoDisponibleException);
    const ctx = await correr({ header: 'tienda-a', info, marcas: [PERMITIR_TIENDA_NO_DISPONIBLE] });
    expect(ctx.tenantId).toBe('id-a');
  });

  it('6) ni JWT ni cabecera → 400, salvo @SinTenant', async () => {
    await expect(correr({})).rejects.toThrow(TenantRequeridoException);
    await expect(correr({ marcas: [SIN_TENANT] })).resolves.toMatchObject({ tenantId: null });
  });
});
