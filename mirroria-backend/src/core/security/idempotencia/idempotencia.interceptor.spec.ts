import {
  ConflictException,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { tenantActual } from '../../tenancy/tenant-context.js';
import { EstadoIdempotencia, type Idempotencia } from './entities/idempotencia.entity.js';
import { calcularHashCuerpo } from './idempotencia.hash.js';
import { IdempotenciaInterceptor } from './idempotencia.interceptor.js';
import type { IdempotenciaService } from './idempotencia.service.js';

interface FakeHttpOpts {
  headers?: Record<string, string>;
  method?: string;
  url?: string;
  body?: unknown;
  user?: { tenantId?: string };
}

function crearContexto(opts: FakeHttpOpts = {}) {
  const headers = opts.headers ?? {};
  const req = {
    headers,
    method: opts.method ?? 'POST',
    url: opts.url ?? '/api/v1/ventas/carrito/u1/checkout',
    path: opts.url ?? '/api/v1/ventas/carrito/u1/checkout',
    body: opts.body ?? {},
    user: opts.user ?? { tenantId: tenantActual() },
  };
  const setHeader = vi.fn();
  const status = vi.fn();
  const res = {
    statusCode: 201,
    setHeader,
    status,
  };
  const ctx = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;

  return { ctx, req, res };
}

describe('IdempotenciaInterceptor', () => {
  const mockService = {
    buscar: vi.fn(),
    registrarIntento: vi.fn(),
    validarHash: vi.fn(),
    marcarCompletado: vi.fn(),
    marcarFallido: vi.fn(),
    reiniciarIntento: vi.fn(),
  } as unknown as IdempotenciaService;

  const interceptor = new IdempotenciaInterceptor(mockService);

  it('1. Petición sin cabecera pasa normal sin tocar la base de idempotencia', async () => {
    const { ctx, res } = crearContexto({ headers: {} });
    const next = { handle: vi.fn(() => of({ ok: true })) };

    const observable = await interceptor.intercept(ctx, next);
    const resultado = await firstValueFrom(observable);

    expect(resultado).toEqual({ ok: true });
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(mockService.buscar).not.toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('2. Petición GET con cabecera pasa normal (método no mutante)', async () => {
    const { ctx } = crearContexto({
      method: 'GET',
      headers: { 'idempotency-key': 'uuid-key-get' },
    });
    const next = { handle: vi.fn(() => of({ datos: [1, 2, 3] })) };

    const observable = await interceptor.intercept(ctx, next);
    const resultado = await firstValueFrom(observable);

    expect(resultado).toEqual({ datos: [1, 2, 3] });
    expect(mockService.buscar).not.toHaveBeenCalled();
  });

  it('3. Primera petición con Idempotency-Key ejecuta y almacena (MISS)', async () => {
    const payload = { prendaId: 'vestido-1', cantidad: 1 };
    const hash = calcularHashCuerpo(payload);
    const { ctx, res } = crearContexto({
      headers: { 'idempotency-key': 'uuid-key-1' },
      body: payload,
    });
    const next = { handle: vi.fn(() => of({ ventaId: 'v-100', status: 'OK' })) };

    vi.mocked(mockService.buscar).mockResolvedValueOnce(null);
    vi.mocked(mockService.registrarIntento).mockResolvedValueOnce({
      id: 'reg-1',
      tenantId: tenantActual(),
      clave: 'uuid-key-1',
      estado: EstadoIdempotencia.EN_PROCESO,
      hashCuerpo: hash,
    } as unknown as Idempotencia);

    const observable = await interceptor.intercept(ctx, next);
    const resultado = await firstValueFrom(observable);

    expect(resultado).toEqual({ ventaId: 'v-100', status: 'OK' });
    expect(mockService.buscar).toHaveBeenCalledWith(tenantActual(), 'uuid-key-1');
    expect(mockService.registrarIntento).toHaveBeenCalledWith({
      tenantId: tenantActual(),
      clave: 'uuid-key-1',
      ruta: '/api/v1/ventas/carrito/u1/checkout',
      metodo: 'POST',
      hashCuerpo: hash,
    });
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Idempotency', 'MISS');
    expect(mockService.marcarCompletado).toHaveBeenCalledWith('reg-1', 201, {
      ventaId: 'v-100',
      status: 'OK',
    });
  });

  it('4. Segunda petición idéntica devuelve la respuesta cacheada sin re-ejecutar (HIT)', async () => {
    const payload = { prendaId: 'vestido-1', cantidad: 1 };
    const hash = calcularHashCuerpo(payload);
    const respuestaPrevia = { ventaId: 'v-100', status: 'OK' };

    const { ctx, res } = crearContexto({
      headers: { 'idempotency-key': 'uuid-key-1' },
      body: payload,
    });
    const next = { handle: vi.fn() };

    vi.mocked(mockService.buscar).mockResolvedValueOnce({
      id: 'reg-1',
      tenantId: tenantActual(),
      clave: 'uuid-key-1',
      hashCuerpo: hash,
      estado: EstadoIdempotencia.COMPLETADO,
      codigoEstado: 201,
      cuerpoRespuesta: respuestaPrevia,
    } as unknown as Idempotencia);
    vi.mocked(mockService.validarHash).mockReturnValueOnce(true);

    const observable = await interceptor.intercept(ctx, next);
    const resultado = await firstValueFrom(observable);

    expect(resultado).toEqual(respuestaPrevia);
    expect(next.handle).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Idempotency', 'HIT');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('5. Petición con misma clave pero cuerpo diferente devuelve 422', async () => {
    const payloadOriginal = { prendaId: 'vestido-1', monto: 100 };
    const payloadModificado = { prendaId: 'vestido-1', monto: 999 };

    const { ctx } = crearContexto({
      headers: { 'idempotency-key': 'uuid-key-1' },
      body: payloadModificado,
    });
    const next = { handle: vi.fn() };

    vi.mocked(mockService.buscar).mockResolvedValueOnce({
      id: 'reg-1',
      tenantId: tenantActual(),
      clave: 'uuid-key-1',
      hashCuerpo: calcularHashCuerpo(payloadOriginal),
      estado: EstadoIdempotencia.COMPLETADO,
      codigoEstado: 201,
      cuerpoRespuesta: {},
    } as unknown as Idempotencia);
    vi.mocked(mockService.validarHash).mockReturnValueOnce(false);

    await expect(interceptor.intercept(ctx, next)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('6. Petición concurrente con código Postgres 23505 devuelve 409', async () => {
    const payload = { prendaId: 'vestido-1' };
    const { ctx } = crearContexto({
      headers: { 'idempotency-key': 'uuid-concurrente' },
      body: payload,
    });
    const next = { handle: vi.fn() };

    vi.mocked(mockService.buscar).mockResolvedValueOnce(null);
    vi.mocked(mockService.registrarIntento).mockRejectedValueOnce({
      driverError: { code: '23505' },
    });

    await expect(interceptor.intercept(ctx, next)).rejects.toMatchObject({
      response: { codigo: 'IDEMPOTENCIA_EN_CURSO' },
    });
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('7. Petición con operación en curso (EN_PROCESO) devuelve 409', async () => {
    const payload = { prendaId: 'vestido-1' };
    const { ctx } = crearContexto({
      headers: { 'idempotency-key': 'uuid-en-curso' },
      body: payload,
    });
    const next = { handle: vi.fn() };

    vi.mocked(mockService.buscar).mockResolvedValueOnce({
      id: 'reg-2',
      tenantId: tenantActual(),
      clave: 'uuid-en-curso',
      hashCuerpo: calcularHashCuerpo(payload),
      estado: EstadoIdempotencia.EN_PROCESO,
    } as unknown as Idempotencia);
    vi.mocked(mockService.validarHash).mockReturnValueOnce(true);

    const error = await interceptor.intercept(ctx, next).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    // H4: el cliente lo distingue por código, no por el texto.
    expect((error as ConflictException).getResponse()).toMatchObject({
      codigo: 'IDEMPOTENCIA_EN_CURSO',
    });
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('8. Petición previa en FALLIDO se reinicia a EN_PROCESO y permite reintento', async () => {
    const payload = { prendaId: 'vestido-1' };
    const hash = calcularHashCuerpo(payload);
    const { ctx, res } = crearContexto({
      headers: { 'idempotency-key': 'uuid-fallida-reintento' },
      body: payload,
    });
    const next = { handle: vi.fn(() => of({ exitoso: true })) };

    vi.mocked(mockService.buscar).mockResolvedValueOnce({
      id: 'reg-3',
      tenantId: tenantActual(),
      clave: 'uuid-fallida-reintento',
      hashCuerpo: hash,
      estado: EstadoIdempotencia.FALLIDO,
    } as unknown as Idempotencia);
    vi.mocked(mockService.validarHash).mockReturnValueOnce(true);
    vi.mocked(mockService.reiniciarIntento).mockResolvedValueOnce({
      id: 'reg-3',
      tenantId: tenantActual(),
      clave: 'uuid-fallida-reintento',
      hashCuerpo: hash,
      estado: EstadoIdempotencia.EN_PROCESO,
    } as unknown as Idempotencia);

    const observable = await interceptor.intercept(ctx, next);
    const resValue = await firstValueFrom(observable);

    expect(resValue).toEqual({ exitoso: true });
    expect(mockService.reiniciarIntento).toHaveBeenCalled();
    expect(mockService.marcarCompletado).toHaveBeenCalledWith('reg-3', 201, {
      exitoso: true,
    });
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Idempotency', 'MISS');
  });

  it('9. Si el controlador falla con excepción, guarda estado FALLIDO y re-lanza el error', async () => {
    const payload = { prendaId: 'vestido-1' };
    const { ctx } = crearContexto({
      headers: { 'idempotency-key': 'uuid-error' },
      body: payload,
    });
    const errorHttp = new HttpException('Stock insuficiente', HttpStatus.CONFLICT);
    const next = { handle: vi.fn(() => throwError(() => errorHttp)) };

    vi.mocked(mockService.buscar).mockResolvedValueOnce(null);
    vi.mocked(mockService.registrarIntento).mockResolvedValueOnce({
      id: 'reg-4',
      tenantId: tenantActual(),
      clave: 'uuid-error',
      estado: EstadoIdempotencia.EN_PROCESO,
      hashCuerpo: calcularHashCuerpo(payload),
    } as unknown as Idempotencia);

    const observable = await interceptor.intercept(ctx, next);
    await expect(firstValueFrom(observable)).rejects.toThrow('Stock insuficiente');

    expect(mockService.marcarFallido).toHaveBeenCalledWith(
      'reg-4',
      409,
      { message: 'Stock insuficiente' },
    );
  });
});
