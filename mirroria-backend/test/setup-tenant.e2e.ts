import { beforeAll, beforeEach } from 'vitest';
import { entrarEnTenantDePrueba } from '../src/core/tenancy/tenant-context.js';
import { MIRRORIA_TENANT_ID } from '../src/core/tenancy/tenant.constants.js';

/**
 * Los e2e llaman a los servicios directo (sin request HTTP): corren dentro de una
 * tienda. Por defecto la demo "mirroria" (las rutas HTTP mandan `X-Tenant: mirroria`);
 * un archivo que solo usa servicios puede pedir una tienda propia con usarTenantE2E().
 */
let tenant = MIRRORIA_TENANT_ID;
export function usarTenantE2E(id: string): void {
  tenant = id;
}

beforeAll(() => entrarEnTenantDePrueba(tenant));
beforeEach(() => entrarEnTenantDePrueba(tenant));
