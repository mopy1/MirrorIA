import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload.interface.js';

/**
 * Chequeo de "dueño del recurso", no de rol — para endpoints con un
 * :usuarioId en la URL (carrito, checkout) donde cualquier usuario
 * autenticado puede operar, pero solo el suyo. Compartido entre
 * ventas/controller/{ventas,carritos}.controller.ts para no duplicarlo.
 */
export function assertOwnUser(usuarioId: string, user: JwtPayload): void {
  if (user.sub !== usuarioId) {
    throw new ForbiddenException('No podés operar el carrito de otro usuario');
  }
}
