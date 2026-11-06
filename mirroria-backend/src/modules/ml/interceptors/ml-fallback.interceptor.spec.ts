import { describe, expect, it, vi } from 'vitest';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { MlFallbackInterceptor } from './ml-fallback.interceptor.js';

describe('MlFallbackInterceptor', () => {
  it('inyecta la cabecera X-ML-Fallback: true cuando el payload indica fallback = true', async () => {
    const interceptor = new MlFallbackInterceptor();
    const setHeader = vi.fn();
    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of({ items: [], fallback: true }),
    };

    const observable = await interceptor.intercept(mockContext, mockHandler);
    observable.subscribe({
      next: (val) => {
        expect(val).toEqual({ items: [], fallback: true });
        expect(setHeader).toHaveBeenCalledWith('X-ML-Fallback', 'true');
      },
    });
  });

  it('inyecta la cabecera X-ML-Fallback: false cuando el microservicio Python respondió (fallback = false)', async () => {
    const interceptor = new MlFallbackInterceptor();
    const setHeader = vi.fn();
    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of({ predicciones: [1, 2], fallback: false }),
    };

    const observable = await interceptor.intercept(mockContext, mockHandler);
    observable.subscribe({
      next: (val) => {
        expect(val).toEqual({ predicciones: [1, 2], fallback: false });
        expect(setHeader).toHaveBeenCalledWith('X-ML-Fallback', 'false');
      },
    });
  });
});
