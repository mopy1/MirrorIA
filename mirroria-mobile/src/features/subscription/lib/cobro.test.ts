import { describe, expect, it } from 'vitest';
import { avisoDeRegreso, formatFecha, planACobrar, siguienteEstado, textoDiasRestantes } from './cobro';
import { opcionesDePago, pasarelasDeSuscripcion, resultadoDeVenta } from '../../payments/lib/metodos-pago';
import type { PasarelaMetadata } from '../../payments/types/pasarelas.types';

const BASICO = { codigo: 'basico', nombre: 'Básico' };
const CADENA = { codigo: 'cadena', nombre: 'Cadena' };

describe('plan a cobrar', () => {
  it('sin plan elegido cobra el actual; con uno válido cobra ese', () => {
    expect(planACobrar([BASICO, CADENA], null, BASICO)).toBe(BASICO);
    expect(planACobrar([BASICO, CADENA], 'cadena', BASICO)).toBe(CADENA);
    expect(planACobrar([BASICO, CADENA], 'inventado', BASICO)).toBe(BASICO);
  });
});

describe('regreso de la pasarela', () => {
  it('una respuesta tardía de pendiente no pisa un pago confirmado', () => {
    expect(siguienteEstado('pagado', { pagado: false, estado: 'PENDIENTE' })).toBe('pagado');
  });

  it('pasa a pagado, rechazado o pendiente según el backend', () => {
    expect(siguienteEstado('confirmando', { pagado: true, estado: 'APROBADO' })).toBe('pagado');
    expect(siguienteEstado('confirmando', { pagado: false, estado: 'RECHAZADO' })).toBe('rechazado');
    expect(siguienteEstado('esperando', { pagado: false, estado: 'PENDIENTE' })).toBe('pendiente');
  });

  it('cada desenlace tiene su aviso y el pendiente no anuncia el pago', () => {
    expect(avisoDeRegreso('pagado').tono).toBe('exito');
    expect(avisoDeRegreso('rechazado').tono).toBe('error');
    expect(avisoDeRegreso('pendiente').texto).not.toMatch(/acreditado/i);
    expect(avisoDeRegreso('esperando').reintentable).toBe(true);
  });
});

describe('textos de la suscripción', () => {
  it('días restantes y fecha', () => {
    expect(textoDiasRestantes(0)).toBe('Vencida');
    expect(textoDiasRestantes(1)).toBe('1 día');
    expect(textoDiasRestantes(12)).toBe('12 días');
    expect(formatFecha('2026-11-22T12:00:00')).toBe('22/11/2026');
    expect(formatFecha('nada')).toBe('—');
  });
});

const p = (id: PasarelaMetadata['id'], extra: Partial<PasarelaMetadata> = {}): PasarelaMetadata => ({
  id, nombre: id, descripcion: '', tipo: 'TARJETA', estado: 'DISPONIBLE', soportaCheckout: true,
  soportaSuscripcion: true, icono: 'credit-card', monedas: ['BOB'], ...extra,
});

describe('medios de pago', () => {
  it('sin lista del servidor se ofrecen los cuatro', () => {
    expect(opcionesDePago(null).map((o) => o.metodo)).toEqual(['TARJETA', 'PAYPAL', 'QR', 'EFECTIVO']);
    expect(opcionesDePago(null).every((o) => o.disponible)).toBe(true);
  });

  it('una pasarela no configurada queda apagada y una ausente también', () => {
    const ops = opcionesDePago([p('STRIPE', { estado: 'NO_CONFIGURADA' }), p('WAYRA'), p('MANUAL')]);
    expect(ops.find((o) => o.metodo === 'TARJETA')?.disponible).toBe(false);
    expect(ops.find((o) => o.metodo === 'PAYPAL')?.disponible).toBe(false);
    expect(ops.find((o) => o.metodo === 'QR')?.disponible).toBe(true);
  });

  it('para la suscripción no va el efectivo y Wayra va primero', () => {
    const lista = pasarelasDeSuscripcion([p('PAYPAL'), p('MANUAL', { soportaSuscripcion: false }), p('STRIPE'), p('WAYRA')]);
    expect(lista.map((x) => x.id)).toEqual(['WAYRA', 'STRIPE', 'PAYPAL']);
  });

  it('el estado real de la venta decide el resultado', () => {
    expect(resultadoDeVenta('PAGADA')).toBe('pagada');
    expect(resultadoDeVenta('ENTREGADA')).toBe('pagada');
    expect(resultadoDeVenta('PENDIENTE')).toBe('pendiente');
    expect(resultadoDeVenta('CANCELADA')).toBe('inactiva');
  });
});
