import { describe, expect, it } from 'vitest';
import { coincideCodigo, codigoCorto } from './codigo';
import { canalVenta, filtrarVentas, recaudado, TRANSICIONES } from './etiquetas';

const v = (id: string, estado: string, canal: string, createdAt: string, numeroComprobante: string | null = null, totalCents = 100) =>
  ({ id, estado, canal, createdAt, numeroComprobante, totalCents });
const AHORA = new Date('2026-11-08T15:00:00');
const ventas = [
  v('aaaa1111', 'PAGADA', 'PRESENCIAL', '2026-11-08T10:00:00', 'C-AAAA1111', 1000),
  v('bbbb2222', 'PENDIENTE', 'WEB', '2026-11-05T10:00:00', null, 500),
  v('cccc3333', 'ENTREGADA', 'MOVIL', '2026-09-01T10:00:00', null, 300),
];

describe('ventas', () => {
  it('recaudado cuenta solo pagadas y entregadas', () => expect(recaudado(ventas)).toBe(1300));
  it('filtra por estado, canal, período y comprobante', () => {
    const f = { estado: '', canal: '', periodo: '', texto: '' };
    expect(filtrarVentas(ventas, { ...f, estado: 'PENDIENTE' }, AHORA).map((x) => x.id)).toEqual(['bbbb2222']);
    expect(filtrarVentas(ventas, { ...f, canal: 'DIGITAL' }, AHORA).map((x) => x.id)).toEqual(['bbbb2222', 'cccc3333']);
    expect(filtrarVentas(ventas, { ...f, periodo: 'hoy' }, AHORA).map((x) => x.id)).toEqual(['aaaa1111']);
    expect(filtrarVentas(ventas, { ...f, periodo: '7d' }, AHORA)).toHaveLength(2);
    expect(filtrarVentas(ventas, { ...f, texto: '#c-aaaa' }, AHORA).map((x) => x.id)).toEqual(['aaaa1111']);
    expect(filtrarVentas(ventas, { ...f, texto: 'BBBB' }, AHORA).map((x) => x.id)).toEqual(['bbbb2222']);
  });
  it('nombra el canal', () => {
    expect(canalVenta('PRESENCIAL')).toBe('Caja física');
    expect(canalVenta('WEB')).toBe('Tienda web');
  });
});

describe('reservas', () => {
  it('código corto y búsqueda tolerante', () => {
    expect(codigoCorto('d6018924-aaaa')).toBe('D6018924');
    expect(coincideCodigo('d6018924-aaaa', '#d60 18')).toBe(true);
    expect(coincideCodigo('d6018924-aaaa', 'X')).toBe(false);
  });
  it('los estados finales no tienen acciones', () => {
    for (const e of ['COMPLETADA', 'CANCELADA', 'NO_SHOW', 'EXPIRADA']) expect(TRANSICIONES[e]).toBeUndefined();
    expect(TRANSICIONES.EN_TIENDA.map((a) => a.estado)).toEqual(['CANCELADA']);
  });
});

import { agruparPorDia, filtrarReservas, tituloDia } from './agenda';

describe('agenda de reservas', () => {
  const rs = [
    { id: 'b', estado: 'CANCELADA', fechaHoraPrevista: '2026-11-09T15:00:00' },
    { id: 'a', estado: 'PENDIENTE', fechaHoraPrevista: '2026-11-08T18:00:00' },
    { id: 'c', estado: 'EN_TIENDA', fechaHoraPrevista: '2026-11-08T11:00:00' },
  ];
  it('agrupa por día y ordena por hora', () => {
    expect(agruparPorDia(rs).map((g) => [g.dia, g.data.map((r) => r.id)])).toEqual([
      ['2026-11-08', ['c', 'a']],
      ['2026-11-09', ['b']],
    ]);
  });
  it('filtra activas o un estado', () => {
    expect(filtrarReservas(rs, 'ACTIVAS').map((r) => r.id)).toEqual(['a', 'c']);
    expect(filtrarReservas(rs, 'CANCELADA').map((r) => r.id)).toEqual(['b']);
    expect(filtrarReservas(rs, '')).toHaveLength(3);
  });
  it('titula hoy y mañana', () => {
    expect(tituloDia('2026-11-08', new Date('2026-11-08T09:00:00'))).toMatch(/^Hoy/);
    expect(tituloDia('2026-11-09', new Date('2026-11-08T09:00:00'))).toMatch(/^Mañana/);
  });
});
