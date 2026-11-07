import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { buildTypeOrmOptions } from './typeorm.config.js';

const config = (valores: Record<string, string> = {}) =>
  ({ get: vi.fn((k: string, d?: unknown) => valores[k] ?? d) }) as unknown as ConfigService;

describe('pool de conexiones', () => {
  it('pedir una conexion con el pool lleno falla a tiempo en vez de colgar la API', () => {
    const { extra } = buildTypeOrmOptions(config()) as { extra: { connectionTimeoutMillis: number } };
    expect(extra.connectionTimeoutMillis).toBeGreaterThan(0);
  });

  it('el tamaño del pool se configura', () => {
    const { extra } = buildTypeOrmOptions(config({ DB_POOL_MAX: '5' })) as { extra: { max: number } };
    expect(extra.max).toBe(5);
  });
});
