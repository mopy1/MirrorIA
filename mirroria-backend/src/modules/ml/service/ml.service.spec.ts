import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { correrConContexto } from '../../../core/tenancy/tenant-context.js';
import { MlService } from './ml.service.js';

describe('MlService (Integración de Machine Learning y Fallback Heurístico)', () => {
  const tenantFijo = '11111111-1111-4111-a111-111111111111';

  const mockDataSource = {
    query: vi.fn(async (sql: string) => {
      if (sql.includes('FROM productos p')) {
        return [
          {
            producto_id: 'prod_vestido_01',
            producto_nombre: 'Vestido Fiesta Rojo',
            categoria: 'VESTIDOS',
            precio_cents: 35000,
            stock_actual: 3,
            vendidas_7d: 7,
          },
        ];
      }
      if (sql.includes('FROM reservas r')) {
        return [
          {
            reserva_id: 'res_101',
            hora_prevista: '16:00',
            fecha_hora_prevista: new Date(),
            createdAt: new Date(Date.now() - 5 * 86400000),
            cliente_nombre: 'Luciana Morales',
            prendas_count: 3,
            hora_cita: 16,
            dia_semana_iso: 2,
            previas: 2,
            asistidas: 1,
          },
        ];
      }
      if (sql.includes('FROM usuarios u') && sql.includes('INNER JOIN ventas v')) {
        return [
          {
            clienta_id: 'cli_01',
            cliente_nombre: 'Mariana Zalles',
            recency_dias: 14,
            frequency_compras: 7,
            monetary_cents: 420000,
          },
        ];
      }
      if (sql.includes('FROM ventas v')) {
        return [
          {
            venta_id: 'vta_01',
            monto_total_cents: 85000,
            descuento_cents: 5000,
            hora_venta: 16,
            metodo_pago: 'WAYRA_QR',
            cantidad_items: 2,
          },
        ];
      }
      return [];
    }),
  };

  const adminUser: JwtPayload = {
    sub: 'usr-admin-1',
    email: 'admin@tiendaria.com',
    role: 'ADMIN',
    sucursalId: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtenerKpisDemanda retorna proyecciones y reabastecimiento sugerido (vía ML microservice o fallback)', async () => {
    await correrConContexto({ tenantId: tenantFijo }, async () => {
      const service = new MlService(mockDataSource as unknown as DataSource);
      const res = await service.obtenerKpisDemanda(adminUser, { dias: 30 });

      expect(res).toBeDefined();
      expect(res.horizonte_dias).toBe(30);
      expect(res.predicciones.length).toBeGreaterThan(0);
      expect(res.predicciones[0].producto_id).toBe('prod_vestido_01');
      expect(res.predicciones[0].demanda_proyectada_unidades).toBeGreaterThan(0);
      expect(res.predicciones[0].reabastecimiento_sugerido).toBeGreaterThanOrEqual(0);
      expect(res.kpis_resumen).toHaveProperty('quiebre_stock_rate_pct');
      expect(res.kpis_resumen).toHaveProperty('rotacion_proyectada');
    });
  });

  it('obtenerKpisNoShow evalúa probabilidad de inasistencia y clasifica con semáforo', async () => {
    await correrConContexto({ tenantId: tenantFijo }, async () => {
      const service = new MlService(mockDataSource as unknown as DataSource);
      const res = await service.obtenerKpisNoShow(adminUser);

      expect(res).toBeDefined();
      expect(res.evaluaciones.length).toBeGreaterThan(0);
      const eval1 = res.evaluaciones[0];
      expect(eval1.probabilidad_no_show).toBeGreaterThanOrEqual(0);
      expect(['VERDE', 'AMARILLO', 'ROJO']).toContain(eval1.color_semaforo);
      expect(['BAJO_RIESGO', 'RIESGO_MEDIO', 'ALTO_RIESGO']).toContain(eval1.clasificacion);
      expect(eval1.factores_clave.length).toBeGreaterThan(0);
    });
  });

  it('obtenerKpisRfm agrupa clientas en segmentos y calcula CLV estimado', async () => {
    await correrConContexto({ tenantId: tenantFijo }, async () => {
      const service = new MlService(mockDataSource as unknown as DataSource);
      const res = await service.obtenerKpisRfm(adminUser);

      expect(res).toBeDefined();
      expect(res.total_clientas).toBeGreaterThan(0);
      expect(res.distribucion_clusters).toBeDefined();
      expect(res.clientas_clasificadas.length).toBeGreaterThan(0);
      expect(res.clv_promedio_bs).toBeGreaterThan(0);
    });
  });

  it('obtenerKpisAnomalias audita transacciones de venta identificando riesgos', async () => {
    await correrConContexto({ tenantId: tenantFijo }, async () => {
      const service = new MlService(mockDataSource as unknown as DataSource);
      const res = await service.obtenerKpisAnomalias(adminUser);

      expect(res).toBeDefined();
      expect(res.total_analizadas).toBeGreaterThan(0);
      expect(res.diagnosticos.length).toBeGreaterThan(0);
      expect(res.diagnosticos[0]).toHaveProperty('score_anomalia');
      expect(res.diagnosticos[0]).toHaveProperty('es_anomalo');
      expect(['NORMAL', 'MODERADO', 'CRITICO']).toContain(res.diagnosticos[0].nivel_riesgo);
    });
  });

  it('obtenerMetricasModelos retorna ficha científica con los 4 modelos y citas canónicas', async () => {
    const service = new MlService(mockDataSource as unknown as DataSource);
    const res = await service.obtenerMetricasModelos();

    expect(res).toBeDefined();
    expect(res.semilla_reproducible).toBe(42);
    expect(res.dataset_size_total).toBe(10000);
    expect(res.modelos.M1_demanda_random_forest.cita_academica).toContain('Breiman');
    expect(res.modelos.M2_noshow_logistic_regression.cita_academica).toContain('Cox');
    expect(res.modelos.M3_rfm_kmeans.cita_academica).toContain('MacQueen');
    expect(res.modelos.M4_anomalias_isolation_forest.cita_academica).toContain('Liu');
  });
});
