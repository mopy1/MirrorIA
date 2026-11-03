import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { ProbadorService } from './probador.service.js';
import { LimiteTokensProbadorException } from '../exception/limite-tokens-probador.exception.js';

vi.mock('@decartai/sdk', () => ({
  createDecartClient: () => ({
    tokens: { create: vi.fn().mockResolvedValue({ apiKey: 'tmp', expiresAt: 'x' }) },
  }),
}));

describe('ProbadorService — tope por IP', () => {
  it('el pedido 11 de la misma IP en 10 min da 429; otra IP sigue pudiendo', async () => {
    const config = { get: vi.fn().mockReturnValue('clave') } as unknown as ConfigService;
    const service = new ProbadorService(config);
    for (let i = 0; i < 10; i++) await service.crearToken('1.1.1.1');
    await expect(service.crearToken('1.1.1.1')).rejects.toThrow(LimiteTokensProbadorException);
    await expect(service.crearToken('2.2.2.2')).resolves.toEqual({ apiKey: 'tmp', expiresAt: 'x' });
  });
});
