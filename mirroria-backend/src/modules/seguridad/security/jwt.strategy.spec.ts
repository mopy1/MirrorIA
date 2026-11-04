import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import type { Usuario } from '../entities/usuario.entity.js';
import { leerJwtSecret } from './jwt-secret.js';
import { JwtStrategy } from './jwt.strategy.js';

const config = (valor?: string) => ({ get: () => valor }) as unknown as ConfigService;
const SECRETO = 'a'.repeat(64);

describe('JWT_SECRET obligatorio', () => {
  it('sin JWT_SECRET o con menos de 32 caracteres, el arranque falla con mensaje claro', () => {
    expect(() => leerJwtSecret(config(undefined))).toThrow(/JWT_SECRET falta/);
    expect(() => leerJwtSecret(config('dev_secret_change_me'))).toThrow(/openssl rand -hex 32/);
    expect(() => new JwtStrategy(config(''), {} as Repository<Usuario>)).toThrow(/JWT_SECRET/);
  });

  it('con 32+ caracteres lo devuelve tal cual', () => {
    expect(leerJwtSecret(config(SECRETO))).toBe(SECRETO);
  });
});

describe('JwtStrategy.validate', () => {
  it('usuario inactivo o borrado → 401 (no 500), para que el front cierre la sesión', async () => {
    const repo = { findOne: vi.fn() };
    const strategy = new JwtStrategy(config(SECRETO), repo as unknown as Repository<Usuario>);
    const payload = { sub: 'u1', email: 'a@b.c', role: 'CUSTOMER', sucursalId: null };

    repo.findOne.mockResolvedValueOnce(null);
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
    repo.findOne.mockResolvedValueOnce({ id: 'u1', isActive: false });
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
