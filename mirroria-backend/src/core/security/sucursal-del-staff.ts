import { ForbiddenActionException } from '../exception/forbidden-action.exception.js';
import type { JwtPayload } from './jwt-payload.interface.js';

/**
 * Staff de sucursal (ENCARGADO_SUCURSAL, CAJERO) opera solo sobre su propia
 * sucursal, sacada del JWT — mismo criterio que `ia` (forzarAlcance).
 * Devuelve undefined para ADMIN (sin límite). Sin sucursal asignada se corta:
 * dejar el filtro vacío abriría todas las sucursales.
 */
export function sucursalDelStaff(user: JwtPayload): string | undefined {
  if (user.role === 'ADMIN') return undefined;
  if (!user.sucursalId) {
    throw new ForbiddenActionException('Tu cuenta no tiene una sucursal asignada');
  }
  return user.sucursalId;
}
