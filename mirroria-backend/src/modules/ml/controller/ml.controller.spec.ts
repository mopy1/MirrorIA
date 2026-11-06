import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { MlController } from './ml.controller.js';
import type { MlService } from '../service/ml.service.js';

describe('MlController (Controlador RESTful de Machine Learning)', () => {
  const mockMlService = {
    obtenerKpisDemanda: vi.fn(async (user, filtro) => ({
      horizonte_dias: filtro?.dias ?? 30,
      total_items_evaluados: 1,
      predicciones: [],
      kpis_resumen: { quiebre_stock_rate_pct: 0, rotacion_proyectada: 4.5 },
    })),
    obtenerKpisNoShow: vi.fn(async (_user, _filtro) => ({
      evaluaciones: [],
      tasa_no_show_esperada_pct: 22.5,
      alertas_criticas_count: 0,
    })),
    obtenerKpisRfm: vi.fn(async (_user) => ({
      total_clientas: 10,
      distribucion_clusters: { VIPS_LEALES: 2 },
      clientas_clasificadas: [],
      tasa_retencion_estimada_pct: 75.0,
      clv_promedio_bs: 3400.0,
    })),
    obtenerKpisAnomalias: vi.fn(async (_user) => ({
      total_analizadas: 30,
      anomalias_detectadas: 1,
      tasa_anomalias_pct: 3.3,
      monto_sospechoso_cents: 12000,
      diagnosticos: [],
    })),
    obtenerMetricasModelos: vi.fn(async () => ({
      fecha_evaluacion: '2026-11-06T08:00:00Z',
      semilla_reproducible: 42,
      dataset_size_total: 10000,
      modelos: {} as any,
    })),
  };

  const controller = new MlController(mockMlService as unknown as MlService);

  const adminUser: JwtPayload = {
    sub: 'usr-admin-1',
    email: 'admin@tiendaria.com',
    role: 'ADMIN',
    sucursalId: null,
  };

  it('GET /ml/kpis/demanda delega al servicio con los parámetros del filtro', async () => {
    const filtro = { dias: 7, sucursalId: 'suc-test-1' };
    const res = await controller.obtenerDemanda(filtro, adminUser);
    expect(mockMlService.obtenerKpisDemanda).toHaveBeenCalledWith(adminUser, filtro);
    expect(res.horizonte_dias).toBe(7);
  });

  it('GET /ml/kpis/no-show delega al servicio para evaluar reservas', async () => {
    const filtro = { sucursalId: 'suc-test-1' };
    const res = await controller.obtenerNoShow(filtro, adminUser);
    expect(mockMlService.obtenerKpisNoShow).toHaveBeenCalledWith(adminUser, filtro);
    expect(res.tasa_no_show_esperada_pct).toBe(22.5);
  });

  it('GET /ml/kpis/no-show/agenda-hoy delega al servicio', async () => {
    const filtro = { sucursalId: 'suc-test-2' };
    const res = await controller.obtenerNoShowAgendaHoy(filtro, adminUser);
    expect(mockMlService.obtenerKpisNoShow).toHaveBeenCalledWith(adminUser, filtro);
    expect(res).toBeDefined();
  });

  it('GET /ml/kpis/rfm delega al servicio para clustering de clientas', async () => {
    const res = await controller.obtenerRfm(adminUser);
    expect(mockMlService.obtenerKpisRfm).toHaveBeenCalledWith(adminUser);
    expect(res.total_clientas).toBe(10);
  });

  it('GET /ml/kpis/rfm/segmentos delega al servicio', async () => {
    const res = await controller.obtenerRfmSegmentos(adminUser);
    expect(mockMlService.obtenerKpisRfm).toHaveBeenCalledWith(adminUser);
    expect(res.clv_promedio_bs).toBe(3400.0);
  });

  it('GET /ml/kpis/anomalias delega al servicio para auditoría de tickets', async () => {
    const res = await controller.obtenerAnomalias(adminUser);
    expect(mockMlService.obtenerKpisAnomalias).toHaveBeenCalledWith(adminUser);
    expect(res.total_analizadas).toBe(30);
  });

  it('GET /ml/kpis/anomalias/recientes delega al servicio', async () => {
    const res = await controller.obtenerAnomaliasRecientes(adminUser);
    expect(mockMlService.obtenerKpisAnomalias).toHaveBeenCalledWith(adminUser);
    expect(res.anomalias_detectadas).toBe(1);
  });

  it('GET /ml/modelos/metricas retorna ficha científica de validación', async () => {
    const res = await controller.obtenerMetricasModelos();
    expect(mockMlService.obtenerMetricasModelos).toHaveBeenCalled();
    expect(res.semilla_reproducible).toBe(42);
  });
});
