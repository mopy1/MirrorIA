import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { TENANT_PRUEBA } from '../../../../vitest.setup.js';
import type { CobrosSuscripcionService } from '../service/cobros-suscripcion.service.js';
import type { MiSuscripcionService } from '../service/mi-suscripcion.service.js';
import { MiSuscripcionController } from './mi-suscripcion.controller.js';

describe('MiSuscripcionController — Cobros y Gestión SaaS', () => {
  let controller: MiSuscripcionController;
  let miSuscripcionService: { ver: ReturnType<typeof vi.fn>; cambiarPlan: ReturnType<typeof vi.fn> };
  let cobrosSuscripcionService: {
    iniciarCobro: ReturnType<typeof vi.fn>;
    obtenerEstado: ReturnType<typeof vi.fn>;
    simularPago: ReturnType<typeof vi.fn>;
  };

  const USER: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@tienda.com',
    role: 'ADMIN',
    sucursalId: null,
    tenantId: TENANT_PRUEBA,
  };

  const REQ = {
    get: vi.fn((header: string) => {
      if (header === 'origin') return 'http://localhost:5174';
      return undefined;
    }),
  } as unknown as Request;

  beforeEach(() => {
    miSuscripcionService = {
      ver: vi.fn().mockResolvedValue({ puedeCambiarPlan: true, pagoDisponible: true }),
      cambiarPlan: vi.fn().mockResolvedValue({ plan: { codigo: 'pro' } }),
    };

    cobrosSuscripcionService = {
      iniciarCobro: vi.fn().mockResolvedValue({
        cobroId: 'cob-1',
        pasarela: 'WAYRA',
        modo: 'QR',
        montoCents: 9900,
        qrBase64: 'data:mock',
      }),
      obtenerEstado: vi.fn().mockResolvedValue({
        cobroId: 'cob-1',
        estado: 'PENDIENTE',
        pagado: false,
      }),
      simularPago: vi.fn().mockResolvedValue({
        cobroId: 'cob-1',
        estado: 'APROBADO',
        pagado: true,
      }),
    };

    controller = new MiSuscripcionController(
      miSuscripcionService as unknown as MiSuscripcionService,
      cobrosSuscripcionService as unknown as CobrosSuscripcionService,
    );
  });

  it('GET /saas/mi-suscripcion consulta suscripción y plan de la tienda actual', async () => {
    const res = await controller.ver();
    expect(miSuscripcionService.ver).toHaveBeenCalledWith(TENANT_PRUEBA);
    expect(res.pagoDisponible).toBe(true);
  });

  it('PATCH /saas/mi-suscripcion/plan cambia de plan', async () => {
    await controller.cambiarPlan({ planCodigo: 'pro' }, USER);
    expect(miSuscripcionService.cambiarPlan).toHaveBeenCalledWith(TENANT_PRUEBA, 'pro', 'admin-1');
  });

  it('POST /saas/mi-suscripcion/cobro inicia cobro con pasarela', async () => {
    const res = await controller.iniciarCobro({ pasarela: 'WAYRA' }, USER, REQ);
    expect(cobrosSuscripcionService.iniciarCobro).toHaveBeenCalledWith(
      TENANT_PRUEBA,
      { pasarela: 'WAYRA' },
      'admin@tienda.com',
      'http://localhost:5174',
    );
    expect(res.cobroId).toBe('cob-1');
    expect(res.modo).toBe('QR');
  });

  it('GET /saas/mi-suscripcion/cobro/:cobroId/estado consulta estado del cobro', async () => {
    const res = await controller.consultarEstadoCobro('cob-1');
    expect(cobrosSuscripcionService.obtenerEstado).toHaveBeenCalledWith(TENANT_PRUEBA, 'cob-1');
    expect(res.estado).toBe('PENDIENTE');
  });

  it('POST /saas/mi-suscripcion/cobro/:cobroId/simular-pago simula el pago en dev', async () => {
    const res = await controller.simularPago('cob-1');
    expect(cobrosSuscripcionService.simularPago).toHaveBeenCalledWith(TENANT_PRUEBA, 'cob-1');
    expect(res.pagado).toBe(true);
  });
});
