import { beforeEach } from 'vitest';
import { entrarEnTenantDePrueba } from './src/core/tenancy/tenant-context.js';

/** Tenant fijo de los unit tests: los servicios filtran con soloTenant() y fallan cerrado sin contexto. */
export const TENANT_PRUEBA = '11111111-1111-4111-a111-111111111111';

beforeEach(() => {
  entrarEnTenantDePrueba(TENANT_PRUEBA);
});
