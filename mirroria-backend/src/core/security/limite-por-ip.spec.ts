import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DemasiadosPedidosException } from '../exception/demasiados-pedidos.exception.js';
import { LimitadorPorIp, LimitePorIp } from './limite-por-ip.js';

const contexto = (headers: Record<string, string>, ip = '9.9.9.9') =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ ip, header: (h: string) => headers[h] }) }),
  }) as unknown as ExecutionContext;

describe('LimitadorPorIp', () => {
  it('deja pasar hasta el máximo por IP y después corta; otra IP no se ve afectada', () => {
    const limitador = new LimitadorPorIp(2, 60_000);
    expect([limitador.permitir('a'), limitador.permitir('a'), limitador.permitir('a')]).toEqual([true, true, false]);
    expect(limitador.permitir('b')).toBe(true);
  });

  it('el guard responde 429 y usa X-Real-IP cuando viene de nginx', () => {
    const guard = new (LimitePorIp(1, 60_000))();
    expect(guard.canActivate(contexto({ 'x-real-ip': '1.1.1.1' }))).toBe(true);
    expect(() => guard.canActivate(contexto({ 'x-real-ip': '1.1.1.1' }))).toThrow(DemasiadosPedidosException);
    // Mismo socket (nginx) pero otra IP real: pasa.
    expect(guard.canActivate(contexto({ 'x-real-ip': '2.2.2.2' }))).toBe(true);
    expect(new DemasiadosPedidosException().getStatus()).toBe(429);
  });
});
