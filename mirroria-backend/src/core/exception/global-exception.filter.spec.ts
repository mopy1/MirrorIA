import type { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter.js';

function responder(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new GlobalExceptionFilter().catch(exception, host);
  return json.mock.calls[0][0] as { status: number; message: string };
}

const pgError = (code: string) =>
  new QueryFailedError('INSERT ...', [], Object.assign(new Error('detalle interno'), { code, detail: 'Key (slug)=(x)' }));

describe('GlobalExceptionFilter — errores de Postgres', () => {
  it('23505 (unique) → 409 sin filtrar el detalle de Postgres', () => {
    const body = responder(pgError('23505'));
    expect(body.status).toBe(409);
    expect(body.message).toMatch(/Ya existe/);
    expect(body.message).not.toMatch(/slug|Key/);
  });

  it('22P02 (uuid mal formado) → 400', () => {
    expect(responder(pgError('22P02'))).toMatchObject({ status: 400, message: 'Identificador inválido' });
  });

  it('otro código de Postgres sigue siendo 500 genérico', () => {
    expect(responder(pgError('XX000'))).toMatchObject({ status: 500, message: 'Error interno del servidor' });
  });
});
