import { describe, expect, it } from 'vitest';
import {
  consultasPermitidas,
  esFallback,
  normalizarAnomalias,
  puedeVerPredicciones,
  RUTAS_ML,
  tabSoloDuena,
} from './ml-consultas';
import type { AnomaliasVentasResponse } from '../types/ml.types';

describe('permisos de Predicciones', () => {
  it('dueña y encargada entran; cajera y clienta no', () => {
    expect(puedeVerPredicciones('ADMIN')).toBe(true);
    expect(puedeVerPredicciones('ENCARGADO_SUCURSAL')).toBe(true);
    expect(puedeVerPredicciones('CAJERO')).toBe(false);
    expect(puedeVerPredicciones(undefined)).toBe(false);
  });

  it('clientas y ventas inusuales son solo de la dueña (como el backend)', () => {
    expect(consultasPermitidas('ADMIN')).toEqual({ demanda: true, noShow: true, rfm: true, anomalias: true, metricas: true });
    expect(consultasPermitidas('ENCARGADO_SUCURSAL')).toEqual({ demanda: true, noShow: true, rfm: false, anomalias: false, metricas: true });
    expect(Object.values(consultasPermitidas('CAJERO')).some(Boolean)).toBe(false);
    expect(tabSoloDuena('rfm')).toBe(true);
    expect(tabSoloDuena('auditoria')).toBe(true);
    expect(tabSoloDuena('demanda')).toBe(false);
  });
});

describe('aviso de estimación aproximada', () => {
  it('manda la cabecera X-ML-Fallback', () => {
    expect(esFallback('true', { fallback: false })).toBe(true);
    expect(esFallback('false', { fallback: true })).toBe(false);
    expect(esFallback(' TRUE ', null)).toBe(true);
  });
  it('sin cabecera legible, usa la bandera del cuerpo', () => {
    expect(esFallback(null, { fallback: true })).toBe(true);
    expect(esFallback(undefined, { fallback: false })).toBe(false);
    expect(esFallback(null, null)).toBe(false);
    expect(esFallback('', [])).toBe(false);
  });
});

describe('rutas del servicio de predicción', () => {
  it('mismos parámetros que la web', () => {
    expect(RUTAS_ML.demanda({ dias: 15 })).toBe('/ml/kpis/demanda?dias=15');
    expect(RUTAS_ML.demanda({ dias: 30, sucursalId: 'a b' })).toBe('/ml/kpis/demanda?dias=30&sucursalId=a+b');
    expect(RUTAS_ML.noShow()).toBe('/ml/kpis/no-show/agenda-hoy');
    expect(RUTAS_ML.anomalias('s1')).toBe('/ml/kpis/anomalias/recientes?sucursalId=s1');
    expect(RUTAS_ML.rfm()).toBe('/ml/kpis/rfm/segmentos');
  });
});

describe('normalización de ventas', () => {
  it('pasa los centavos que llegan como texto a número', () => {
    const res = normalizarAnomalias({
      total_analizadas: 1,
      anomalias_detectadas: 0,
      tasa_anomalias_pct: 0,
      monto_sospechoso_cents: '0' as unknown as number,
      diagnosticos: [
        {
          venta_id: 'v',
          score_anomalia: 0.1,
          es_anomalo: false,
          nivel_riesgo: 'NORMAL',
          monto_total_cents: '187000' as unknown as number,
          descuento_cents: null as unknown as number,
        },
      ],
    } as AnomaliasVentasResponse);
    expect(res.diagnosticos[0].monto_total_cents).toBe(187000);
    expect(res.diagnosticos[0].descuento_cents).toBeUndefined();
    expect(res.monto_sospechoso_cents).toBe(0);
  });
});
