import { beforeAll, beforeEach } from 'vitest';
import { entrarEnTenantDePrueba } from '../src/core/tenancy/tenant-context.js';
import { TIENDA_DEMO_ID } from '../src/core/tenancy/tenant.constants.js';

/**
 * Los e2e llaman a los servicios directo (sin request HTTP): corren dentro de una
 * tienda. Por defecto la demo "tiendaria" (las rutas HTTP mandan `X-Tenant: tiendaria`);
 * un archivo que solo usa servicios puede pedir una tienda propia con usarTenantE2E().
 */
let tenant = TIENDA_DEMO_ID;
export function usarTenantE2E(id: string): void {
  tenant = id;
}

beforeAll(() => entrarEnTenantDePrueba(tenant));
beforeEach(() => entrarEnTenantDePrueba(tenant));
