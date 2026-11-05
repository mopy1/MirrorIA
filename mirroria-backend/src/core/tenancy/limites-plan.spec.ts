import { describe, expect, it } from 'vitest';
import { LimitePlanExcedidoException } from '../exception/limite-plan-excedido.exception.js';
import { assertDentroDelPlan } from './limites-plan.js';
import { conTenant } from './tenant-context.js';

const basico = { maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3 };

describe('assertDentroDelPlan', () => {
  it('con el uso en el tope lanza 409 con el mensaje del plan', async () => {
    await conTenant({ tenantId: 't', planNombre: 'Básico', limites: basico }, async () => {
      expect(() => assertDentroDelPlan('sucursales', 1)).toThrow(LimitePlanExcedidoException);
      expect(() => assertDentroDelPlan('sucursales', 1)).toThrow(
        'Tu plan Básico permite hasta 1 sucursal. Mejorá tu plan para agregar más.',
      );
      expect(() => assertDentroDelPlan('usuariosStaff', 3)).toThrow(/3 usuarios del equipo/);
      expect(() => assertDentroDelPlan('productos', 50)).toThrow(/50 productos activos/);
    });
  });

  it('por debajo del tope no hace nada', async () => {
    await conTenant({ tenantId: 't', planNombre: 'Básico', limites: basico }, async () => {
      expect(() => assertDentroDelPlan('productos', 49)).not.toThrow();
    });
  });

  it('límite null (ilimitado) o sin límites en el contexto no valida', async () => {
    await conTenant(
      { tenantId: 't', limites: { maxSucursales: null, maxProductos: null, maxUsuariosStaff: null } },
      async () => expect(() => assertDentroDelPlan('sucursales', 999)).not.toThrow(),
    );
    await conTenant({ tenantId: 't' }, async () => expect(() => assertDentroDelPlan('sucursales', 999)).not.toThrow());
  });
});
