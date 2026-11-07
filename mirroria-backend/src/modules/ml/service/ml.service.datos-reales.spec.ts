import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { correrConContexto } from '../../../core/tenancy/tenant-context.js';
import { MlService } from './ml.service.js';

const ADMIN = { sub: 'u1', email: 'a@b.c', role: 'ADMIN', sucursalId: null, tenantId: 't1' } as unknown as JwtPayload;
const enTienda = <T>(fn: () => Promise<T>) =>
  correrConContexto({ tenantId: '11111111-1111-4111-a111-111111111111' } as never, fn);

function servicio(query: (sql: string) => unknown[] | Promise<unknown[]>) {
  return new MlService({ query: vi.fn(async (sql: string) => query(sql)) } as unknown as DataSource);
}

/** Lo que le llega al microservicio, y una respuesta como la suya. */
function mlResponde(respuesta: unknown) {
  const pedidos: { url: string; cuerpo: any }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    pedidos.push({ url, cuerpo: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify(respuesta), { status: 200 });
  }));
  return pedidos;
}

describe('ML con los datos reales de la tienda', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('una tienda sin prendas no recibe prendas inventadas ni llama al modelo', async () => {
    const pedidos = mlResponde({});
    const r = await enTienda(() => servicio(() => []).obtenerKpisDemanda(ADMIN));
    expect(r.predicciones).toEqual([]);
    expect(r.fallback).toBe(false);
    expect(pedidos).toHaveLength(0);
  });

  it('sin reservas, clientas ni ventas tampoco inventa datos', async () => {
    mlResponde({});
    const s = servicio(() => []);
    expect((await enTienda(() => s.obtenerKpisNoShow(ADMIN))).evaluaciones).toEqual([]);
    expect((await enTienda(() => s.obtenerKpisRfm(ADMIN))).clientas_clasificadas).toEqual([]);
    expect((await enTienda(() => s.obtenerKpisAnomalias(ADMIN))).diagnosticos).toEqual([]);
  });

  it('un error de base de datos se ve, no se tapa con datos falsos', async () => {
    const s = servicio(() => {
      throw new Error('column p.nombre does not exist');
    });
    await expect(enTienda(() => s.obtenerKpisDemanda(ADMIN))).rejects.toThrow('does not exist');
  });

  it('la demanda usa las ventas reales de los ultimos 7 dias y devuelve el nombre', async () => {
    const pedidos = mlResponde({
      horizonte_dias: 30, total_items_evaluados: 1,
      predicciones: [{ producto_id: 'p1', demanda_proyectada_unidades: 9, stock_actual: 2, reabastecimiento_sugerido: 8, riesgo_quiebre: 'ALTO', dias_de_stock_estimados: 6 }],
      kpis_resumen: { quiebre_stock_rate_pct: 100, rotacion_proyectada: 3 },
    });
    const s = servicio(() => [{ producto_id: 'p1', producto_nombre: 'Falda Plisada', categoria: 'Faldas', precio_cents: 1000, stock_actual: 2, vendidas_7d: 11 }]);

    const r = await enTienda(() => s.obtenerKpisDemanda(ADMIN));

    expect(pedidos[0].cuerpo.prendas[0].demanda_historica_lag7).toBe(11);
    expect(r.predicciones[0]).toMatchObject({ nombre: 'Falda Plisada', categoria: 'Faldas' });
  });

  it('el no-show usa el historial real de la clienta y el dia con lunes = 0', async () => {
    const pedidos = mlResponde({ evaluaciones: [] });
    const s = servicio(() => [{
      reserva_id: 'r1', hora_prevista: '09:30', hora_cita: 9, dia_semana_iso: 1, fecha_hora_prevista: new Date('2026-11-09T13:30:00Z'),
      createdAt: new Date('2026-11-01T13:30:00Z'), cliente_nombre: 'Ana', prendas_count: 2, previas: 4, asistidas: 1,
    }]);

    await enTienda(() => s.obtenerKpisNoShow(ADMIN));

    expect(pedidos[0].cuerpo.reservas[0]).toMatchObject({
      reservas_previas_total: 4, tasa_asistencia_historica: 0.25, dia_semana: 0, hora_cita: 9, es_fin_de_semana: false,
    });
  });

  it('con el modelo caido, los numeros salen de las reservas de la tienda', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('caido'); }));
    const s = servicio(() => [{
      reserva_id: 'r1', hora_prevista: '09:30', hora_cita: 9, dia_semana_iso: 1, fecha_hora_prevista: new Date(),
      createdAt: new Date(), cliente_nombre: 'Ana', prendas_count: 2, previas: 4, asistidas: 4,
    }]);

    const r = await enTienda(() => s.obtenerKpisNoShow(ADMIN));

    expect(r.fallback).toBe(true);
    expect(r.tasa_no_show_esperada_pct).toBe(r.evaluaciones[0].probabilidad_no_show * 100);
  });
});
