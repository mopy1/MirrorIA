import type { EntityManager } from 'typeorm';
import { LimitePlanExcedidoException } from '../exception/limite-plan-excedido.exception.js';
import { contextoTenant, tenantActual, type LimitesPlan } from './tenant-context.js';

export type RecursoPlan = 'sucursales' | 'productos' | 'usuariosStaff';

const CAMPO: Record<RecursoPlan, keyof LimitesPlan> = {
  sucursales: 'maxSucursales',
  productos: 'maxProductos',
  usuariosStaff: 'maxUsuariosStaff',
};

/** [singular, plural]: "hasta 1 sucursal", "hasta 3 sucursales". */
const NOMBRE: Record<RecursoPlan, [string, string]> = {
  sucursales: ['sucursal', 'sucursales'],
  productos: ['producto activo', 'productos activos'],
  usuariosStaff: ['usuario del equipo', 'usuarios del equipo'],
};

/**
 * Los límites viajan en el contexto del request (los carga TenantInterceptor):
 * así ningún módulo importa `saas`. Sin límites en el contexto o con límite
 * null (ilimitado) no hace nada. `usoActual` es lo que ya existe, sin el nuevo.
 */
/**
 * Contar y crear por separado dejaba pasar altas simultáneas (6 sucursales en un
 * plan de 3). Dentro de la transacción del alta, este bloqueo hace esperar a la
 * siguiente hasta que la primera termine; se libera solo al cerrar la transacción.
 */
export async function bloquearCupoDelPlan(manager: EntityManager, recurso: RecursoPlan): Promise<void> {
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`cupo:${tenantActual()}:${recurso}`]);
}

export function assertDentroDelPlan(recurso: RecursoPlan, usoActual: number): void {
  const ctx = contextoTenant();
  const limite = ctx?.limites?.[CAMPO[recurso]];
  if (limite === null || limite === undefined) return;
  if (usoActual >= limite) {
    throw new LimitePlanExcedidoException(ctx?.planNombre ?? 'actual', limite, NOMBRE[recurso][limite === 1 ? 0 : 1]);
  }
}
