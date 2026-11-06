import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { DashboardController } from './dashboard.controller.js';
import type { DashboardEjecutivoService } from '../service/dashboard-ejecutivo.service.js';
import type { DashboardOperativoService } from '../service/dashboard-operativo.service.js';
import { PeriodoDashboard } from '../dto/filtro-dashboard-ejecutivo.dto.js';

describe('DashboardController (Endpoints RESTful de BI)', () => {
  const mockEjecutivoService = {
    obtener: vi.fn(async (filtro) => ({
      periodo: { clave: filtro.periodo ?? '30d', sucursalId: filtro.sucursalId ?? null },
      kpis: {},
      graficos: {},
      planSaaS: {},
    })),
  };

  const mockOperativoService = {
    obtener: vi.fn(async (user, filtro) => ({
      fecha: '2026-11-06',
      sucursal: { id: user.sucursalId ?? filtro.sucursalId ?? 'suc-1' },
      kpisHoy: {},
      reservasHoy: [],
      alertasStock: [],
    })),
  };

  const controller = new DashboardController(
    mockEjecutivoService as unknown as DashboardEjecutivoService,
    mockOperativoService as unknown as DashboardOperativoService,
  );

  it('GET /dashboard/ejecutivo pasa los filtros al servicio para rol ADMIN', async () => {
    const adminUser: JwtPayload = {
      sub: 'usr-admin-1',
      email: 'admin@tienda.com',
      role: 'ADMIN',
      sucursalId: null,
    };

    const filtro = {
      periodo: PeriodoDashboard.SIETE_DIAS,
      sucursalId: 'suc-admin-99',
    };

    await controller.obtenerEjecutivo(filtro, adminUser);
    expect(mockEjecutivoService.obtener).toHaveBeenCalledWith({
      periodo: PeriodoDashboard.SIETE_DIAS,
      sucursalId: 'suc-admin-99',
    });
  });

  it('GET /dashboard/ejecutivo acota a la sucursal del token si el rol es ENCARGADO_SUCURSAL', async () => {
    const encargadoUser: JwtPayload = {
      sub: 'usr-encargado-1',
      email: 'encargado@tienda.com',
      role: 'ENCARGADO_SUCURSAL',
      sucursalId: 'suc-encargado-777',
    };

    const filtro = {
      periodo: PeriodoDashboard.MES_ACTUAL,
      sucursalId: 'intento-ver-otra-sucursal',
    };

    await controller.obtenerEjecutivo(filtro, encargadoUser);
    expect(mockEjecutivoService.obtener).toHaveBeenCalledWith({
      periodo: PeriodoDashboard.MES_ACTUAL,
      sucursalId: 'suc-encargado-777',
    });
  });

  it('GET /dashboard/operativo delega al servicio pasando user y filtro', async () => {
    const cajeroUser: JwtPayload = {
      sub: 'usr-cajero-1',
      email: 'cajero@tienda.com',
      role: 'CAJERO',
      sucursalId: 'suc-cajero-55',
    };

    const filtro = {};
    const res = await controller.obtenerOperativo(filtro, cajeroUser);
    expect(mockOperativoService.obtener).toHaveBeenCalledWith(cajeroUser, filtro);
    expect(res.fecha).toBe('2026-11-06');
    expect(res.sucursal.id).toBe('suc-cajero-55');
  });
});
