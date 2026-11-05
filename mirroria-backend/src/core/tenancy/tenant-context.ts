import { AsyncLocalStorage } from 'node:async_hooks';
import { TenantRequeridoException } from '../exception/tenant-requerido.exception.js';

export interface LimitesPlan {
  maxSucursales: number | null;
  maxProductos: number | null;
  maxUsuariosStaff: number | null;
}

export interface ContextoTenant {
  /** Crudo, lo deja el middleware (normalizado: trim + minúsculas). */
  headerSlug: string | null;
  /** Lo llena TenantInterceptor (o conTenant). */
  tenantId: string | null;
  slug: string | null;
  nombre: string | null;
  planNombre: string | null;
  /** null = no se valida (barridas, webhooks). */
  limites: LimitesPlan | null;
}

const als = new AsyncLocalStorage<ContextoTenant>();

/** Contexto del request (o de conTenant) actual; undefined fuera de cualquiera. */
export function contextoTenant(): ContextoTenant | undefined {
  return als.getStore();
}

/** Falla cerrado: sin tienda en el contexto lanza 400 en vez de devolver datos de todas. */
export function tenantActual(): string {
  const id = als.getStore()?.tenantId;
  if (!id) throw new TenantRequeridoException();
  return id;
}

export function tenantOpcional(): string | null {
  return als.getStore()?.tenantId ?? null;
}

/**
 * SOLO TESTS UNITARIOS (vitest.setup.ts): deja un tenant de prueba como contexto
 * del hilo de cada test, así los specs de servicios no envuelven cada caso.
 */
export function entrarEnTenantDePrueba(tenantId: string): void {
  als.enterWith({ headerSlug: null, tenantId, slug: 'prueba', nombre: 'Tienda de prueba', planNombre: null, limites: null });
}

/** Abre un contexto vacío (lo usa TenantMiddleware por request). */
export function correrConContexto<T>(ctx: ContextoTenant, fn: () => T): T {
  return als.run(ctx, fn);
}

/**
 * Corre fn con un contexto NUEVO (no muta el del request). Lo usan las barridas,
 * los webhooks y el aprovisionamiento.
 */
export function conTenant<T>(
  ctx: { tenantId: string } & Partial<ContextoTenant>,
  fn: () => Promise<T>,
): Promise<T> {
  return als.run(
    {
      headerSlug: null,
      slug: null,
      nombre: null,
      planNombre: null,
      limites: null,
      ...ctx,
    },
    fn,
  );
}

/** where: soloTenant({ id }) → { id, tenantId: tenantActual() }. Con array (OR), a cada elemento. */
export function soloTenant<W extends object>(where: W): W & { tenantId: string };
export function soloTenant<W extends object>(where: W[]): Array<W & { tenantId: string }>;
export function soloTenant<W extends object>(
  where: W | W[],
): (W & { tenantId: string }) | Array<W & { tenantId: string }> {
  const tenantId = tenantActual();
  if (Array.isArray(where)) return where.map((w) => ({ ...w, tenantId }));
  return { ...where, tenantId };
}
