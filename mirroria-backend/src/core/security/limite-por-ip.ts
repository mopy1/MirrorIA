import { type CanActivate, type ExecutionContext, mixin, type Type } from '@nestjs/common';
import type { Request } from 'express';
import { DemasiadosPedidosException } from '../exception/demasiados-pedidos.exception.js';

/**
 * Detrás de Nginx el socket es siempre el del contenedor de nginx: la IP real
 * llega en X-Real-IP ($remote_addr, que nginx pisa y el cliente no puede
 * falsear). Sin nginx (móvil directo a :3000), la del socket.
 */
export function ipDelPedido(req: Request): string {
  return req.header('x-real-ip') ?? req.ip ?? 'desconocida';
}

/**
 * Ventana fija en memoria por clave (IP). Sin dependencias: sirve porque hay
 * UNA sola instancia del backend; con varias réplicas habría que moverlo a la BD.
 */
export class LimitadorPorIp {
  private readonly pedidos = new Map<string, { desde: number; n: number }>();

  constructor(
    private readonly max: number,
    private readonly ventanaMs: number,
  ) {}

  /** Cuenta un pedido; `false` si la IP ya gastó su cupo en esta ventana. */
  permitir(ip: string): boolean {
    const ahora = Date.now();
    // Barre ventanas vencidas para que el Map no crezca sin límite.
    for (const [clave, v] of this.pedidos) {
      if (ahora - v.desde >= this.ventanaMs) this.pedidos.delete(clave);
    }
    const actual = this.pedidos.get(ip) ?? { desde: ahora, n: 0 };
    if (actual.n >= this.max) return false;
    actual.n++;
    this.pedidos.set(ip, actual);
    return true;
  }
}

/** `@UseGuards(LimitePorIp(10, 5 * 60_000))` → 429 al pedido 11 de la misma IP en 5 min. */
export function LimitePorIp(max: number, ventanaMs: number): Type<CanActivate> {
  class LimitePorIpGuard implements CanActivate {
    private readonly limitador = new LimitadorPorIp(max, ventanaMs);

    canActivate(context: ExecutionContext): boolean {
      if (!this.limitador.permitir(ipDelPedido(context.switchToHttp().getRequest<Request>()))) {
        throw new DemasiadosPedidosException();
      }
      return true;
    }
  }
  return mixin(LimitePorIpGuard);
}
