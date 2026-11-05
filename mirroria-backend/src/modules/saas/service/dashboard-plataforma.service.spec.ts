import { describe, expect, it } from 'vitest';
import type { InquilinoResumenDto } from '../dto/inquilino.dto.js';
import { EstadoSuscripcion, type Suscripcion } from '../entities/suscripcion.entity.js';
import { MS_DIA } from '../saas-reglas.js';
import { altasPorMes, churn30d, conversionPrueba, mesLaPaz } from './dashboard-plataforma.service.js';

const AHORA = new Date('2026-11-05T12:00:00Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * MS_DIA);
const sub = (id: string, estado: EstadoSuscripcion, inicio: Date, fin: Date, ref: string | null = null) =>
  ({ inquilino: { id }, estado, inicio, fin, referenciaPago: ref }) as unknown as Suscripcion;
const tienda = (id: string, disponible: boolean, creada = hace(1), estado = 'ACTIVO') =>
  ({ id, disponible, estado, createdAt: creada.toISOString() }) as unknown as InquilinoResumenDto;

describe('Dashboard de plataforma (funciones puras)', () => {
  it('altasPorMes devuelve 12 meses con ceros, terminando en el mes actual de La Paz', () => {
    const serie = altasPorMes([hace(1), hace(2), hace(40), hace(400)], AHORA);
    expect(serie).toHaveLength(12);
    expect(serie[0].mes).toBe('2025-12');
    expect(serie[11]).toEqual({ mes: '2026-11', altas: 2 });
    expect(serie[10]).toEqual({ mes: '2026-10', altas: 0 });
    expect(serie[9]).toEqual({ mes: '2026-09', altas: 1 });
    expect(serie.reduce((s, m) => s + m.altas, 0)).toBe(3); // la de hace 400 días queda fuera
  });

  it('el mes se cuenta en La Paz (UTC-4): 1 de noviembre 02:00 UTC es todavía octubre', () => {
    expect(mesLaPaz(new Date('2026-11-01T02:00:00Z'))).toBe('2026-10');
    expect(mesLaPaz(new Date('2026-11-01T05:00:00Z'))).toBe('2026-11');
  });

  it('churn con base 0 → tasa 0 (sin dividir por cero)', () => {
    expect(churn30d([], [], AHORA.getTime())).toEqual({ tasa: 0, perdidas: 0, base: 0 });
    const soloTrial = [sub('a', EstadoSuscripcion.TRIAL, hace(40), hace(-10))];
    expect(churn30d(soloTrial, [tienda('a', true)], AHORA.getTime()).base).toBe(0);
  });

  it('churn: de 2 pagadas hace 30 días, 1 hoy ya no está vigente → 50%', () => {
    const subs = [
      sub('a', EstadoSuscripcion.ACTIVA, hace(60), hace(-20), 'pago-a'),
      sub('b', EstadoSuscripcion.VENCIDA, hace(60), hace(5), 'pago-b'),
    ];
    expect(churn30d(subs, [tienda('a', true), tienda('b', false)], AHORA.getTime()))
      .toEqual({ tasa: 0.5, perdidas: 1, base: 2 });
  });

  it('conversión de prueba: solo altas de hace 14 a 90 días; convertida = alguna referencia de pago', () => {
    const tiendas = [tienda('a', true, hace(20)), tienda('b', true, hace(30)), tienda('c', true, hace(3))];
    const subs = [sub('a', EstadoSuscripcion.ACTIVA, hace(5), hace(-25), 'pago'), sub('b', EstadoSuscripcion.VENCIDA, hace(30), hace(16))];
    expect(conversionPrueba(subs, tiendas, AHORA.getTime())).toEqual({ tasa: 0.5, convertidas: 1, cerradas: 2 });
    expect(conversionPrueba([], [], AHORA.getTime()).tasa).toBe(0);
  });
});
