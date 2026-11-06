import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PeriodoDashboard } from '../dto/filtro-dashboard-ejecutivo.dto.js';
import { PeriodosService } from './periodos.service.js';

describe('PeriodosService (Cálculos temporales y deltas en America/La_Paz)', () => {
  const service = new PeriodosService();
  // Fecha fija de referencia: viernes 6 de noviembre de 2026 a las 14:30 en La Paz (18:30 UTC)
  const referenciaFija = new Date('2026-11-06T18:30:00.000Z');

  describe('calcularRango', () => {
    it('HOY genera intervalo de hoy y el día anterior simétrico en hora boliviana', () => {
      const rango = service.calcularRango(PeriodoDashboard.HOY, undefined, undefined, referenciaFija);
      expect(rango.clave).toBe('hoy');
      expect(rango.dias).toBe(1);

      // En La Paz (UTC-4), 2026-11-06 00:00:00 es 2026-11-06 04:00:00Z
      expect(rango.desde.toISOString()).toBe('2026-11-06T04:00:00.000Z');
      expect(rango.hasta.toISOString()).toBe('2026-11-07T03:59:59.999Z');

      // Ayer en La Paz: 2026-11-05
      expect(rango.anteriorDesde.toISOString()).toBe('2026-11-05T04:00:00.000Z');
      expect(rango.anteriorHasta.toISOString()).toBe('2026-11-06T03:59:59.999Z');
    });

    it('7d calcula 7 días terminando hoy y 7 días previos simétricos', () => {
      const rango = service.calcularRango(PeriodoDashboard.SIETE_DIAS, undefined, undefined, referenciaFija);
      expect(rango.clave).toBe('7d');
      expect(rango.dias).toBe(7);

      expect(service.formatearFechaLaPaz(rango.desde)).toBe('2026-10-31');
      expect(service.formatearFechaLaPaz(rango.hasta)).toBe('2026-11-06');

      expect(service.formatearFechaLaPaz(rango.anteriorDesde)).toBe('2026-10-24');
      expect(service.formatearFechaLaPaz(rango.anteriorHasta)).toBe('2026-10-30');
    });

    it('30d calcula 30 días terminando hoy y 30 días previos simétricos', () => {
      const rango = service.calcularRango(PeriodoDashboard.TREINTA_DIAS, undefined, undefined, referenciaFija);
      expect(rango.clave).toBe('30d');
      expect(rango.dias).toBe(30);

      expect(service.formatearFechaLaPaz(rango.desde)).toBe('2026-10-08');
      expect(service.formatearFechaLaPaz(rango.hasta)).toBe('2026-11-06');
    });

    it('MES_ACTUAL abarca del 1 al 30 de noviembre y anterior es octubre completo', () => {
      const rango = service.calcularRango(PeriodoDashboard.MES_ACTUAL, undefined, undefined, referenciaFija);
      expect(service.formatearFechaLaPaz(rango.desde)).toBe('2026-11-01');
      expect(service.formatearFechaLaPaz(rango.hasta)).toBe('2026-11-30');
      expect(service.formatearFechaLaPaz(rango.anteriorDesde)).toBe('2026-10-01');
      expect(service.formatearFechaLaPaz(rango.anteriorHasta)).toBe('2026-10-31');
    });

    it('MES_ANTERIOR abarca octubre completo y anterior es septiembre', () => {
      const rango = service.calcularRango(PeriodoDashboard.MES_ANTERIOR, undefined, undefined, referenciaFija);
      expect(service.formatearFechaLaPaz(rango.desde)).toBe('2026-10-01');
      expect(service.formatearFechaLaPaz(rango.hasta)).toBe('2026-10-31');
      expect(service.formatearFechaLaPaz(rango.anteriorDesde)).toBe('2026-09-01');
      expect(service.formatearFechaLaPaz(rango.anteriorHasta)).toBe('2026-09-30');
    });

    it('PERSONALIZADO acepta fechas válidas y calcula anterior simétrico', () => {
      const rango = service.calcularRango(
        PeriodoDashboard.PERSONALIZADO,
        '2026-08-01',
        '2026-08-10',
      );
      expect(service.formatearFechaLaPaz(rango.desde)).toBe('2026-08-01');
      expect(service.formatearFechaLaPaz(rango.hasta)).toBe('2026-08-10');
      expect(rango.dias).toBe(10);
    });

    it('PERSONALIZADO lanza BadRequestException si falta alguna fecha o fechaInicio > fechaFin', () => {
      expect(() => service.calcularRango(PeriodoDashboard.PERSONALIZADO, '2026-08-10', undefined)).toThrow(BadRequestException);
      expect(() => service.calcularRango(PeriodoDashboard.PERSONALIZADO, '2026-08-15', '2026-08-10')).toThrow(BadRequestException);
    });
  });

  describe('calcularDelta', () => {
    it('calcula incremento porcentual positivo correctamente', () => {
      const delta = service.calcularDelta(11500, 10000);
      expect(delta.variacionPorcentaje).toBe(15.0);
      expect(delta.tendencia).toBe('POSITIVA');
    });

    it('calcula decremento porcentual negativo correctamente', () => {
      const delta = service.calcularDelta(8500, 10000);
      expect(delta.variacionPorcentaje).toBe(-15.0);
      expect(delta.tendencia).toBe('NEGATIVA');
    });

    it('maneja división por cero devolviendo +100% cuando anterior es 0 y actual > 0', () => {
      const delta = service.calcularDelta(5000, 0);
      expect(delta.variacionPorcentaje).toBe(100.0);
      expect(delta.tendencia).toBe('POSITIVA');
    });

    it('maneja 0 vs 0 devolviendo 0% y tendencia neutra', () => {
      const delta = service.calcularDelta(0, 0);
      expect(delta.variacionPorcentaje).toBe(0.0);
      expect(delta.tendencia).toBe('NEUTRA');
    });
  });

  describe('generarSerieDias', () => {
    it('genera todas las fechas intermedias en formato YYYY-MM-DD sin huecos', () => {
      const desde = new Date('2026-11-01T04:00:00.000Z');
      const hasta = new Date('2026-11-04T03:59:59.999Z');
      const serie = service.generarSerieDias(desde, hasta);
      expect(serie).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    });
  });

  describe('minutosParaCita', () => {
    it('calcula minutos restantes positivos cuando la cita es futura', () => {
      const ref = new Date('2026-11-06T14:00:00.000Z');
      const cita = new Date('2026-11-06T14:45:00.000Z');
      expect(service.minutosParaCita(cita, ref)).toBe(45);
    });

    it('devuelve 0 si la cita ya venció o está en curso', () => {
      const ref = new Date('2026-11-06T15:00:00.000Z');
      const cita = new Date('2026-11-06T14:45:00.000Z');
      expect(service.minutosParaCita(cita, ref)).toBe(0);
    });
  });
});
