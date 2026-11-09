import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accionPase, codigoPase, momentoRecordatorio, reservaActiva, ventaDeReserva } from './comprar-reserva.ts';

const R = 'd6e4df06-6566-4d0b-b1d3-ba216eadef4d';
const base = { online: true, ventas: [], reservaId: R, recordatorioEn: 1 };

test('"Comprar lo que reservé" solo con la reserva EN_TIENDA', () => {
  assert.deepEqual(accionPase({ ...base, estado: 'EN_TIENDA' }), { tipo: 'COMPRAR', habilitado: true, motivo: null });
  for (const estado of ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'NO_SHOW', 'COMPLETADA']) {
    assert.notEqual(accionPase({ ...base, estado }).tipo, 'COMPRAR', estado);
  }
});

test('sin red el botón se deshabilita con el motivo (no se encola, D4)', () => {
  const a = accionPase({ ...base, estado: 'EN_TIENDA', online: false });
  assert.equal(a.tipo, 'COMPRAR');
  assert.equal(a.habilitado, false);
  assert.match(a.motivo ?? '', /conexión/);
});

test('si ya hay una compra PENDIENTE de esa reserva → "Pagar" esa (sin crear otra)', () => {
  const ventas = [{ id: 'v1', reservaId: R, estado: 'PENDIENTE' }, { id: 'v0', reservaId: R, estado: 'CANCELADA' }];
  assert.deepEqual(accionPase({ ...base, estado: 'EN_TIENDA', ventas }), { tipo: 'PAGAR', habilitado: true, motivo: null, ventaId: 'v1' });
  assert.equal(ventaDeReserva(ventas, 'otra'), null);
});

test('COMPLETADA → link al pedido pagado; PENDIENTE/CONFIRMADA → recordatorio', () => {
  const ventas = [{ id: 'v0', reservaId: R, estado: 'CANCELADA' }, { id: 'v2', reservaId: R, estado: 'PAGADA' }];
  assert.deepEqual(accionPase({ ...base, estado: 'COMPLETADA', ventas }), { tipo: 'VER_PEDIDO', habilitado: true, motivo: null, ventaId: 'v2' });
  assert.equal(accionPase({ ...base, estado: 'CONFIRMADA' }).tipo, 'RECORDATORIO');
  assert.equal(accionPase({ ...base, estado: 'PENDIENTE', recordatorioEn: null }).habilitado, false);
});

test('recordatorio 1 h antes, nunca en el pasado', () => {
  const ahora = Date.parse('2026-11-08T14:00:00Z');
  assert.equal(momentoRecordatorio('2026-11-08T16:00:00Z', ahora), Date.parse('2026-11-08T15:00:00Z'));
  assert.equal(momentoRecordatorio('2026-11-08T14:30:00Z', ahora), null);
  assert.equal(momentoRecordatorio('no es fecha', ahora), null);
});

test('código del pase y reservas activas', () => {
  assert.equal(codigoPase(R), 'D6E4DF06');
  assert.ok(reservaActiva('EN_TIENDA'));
  assert.ok(!reservaActiva('COMPLETADA'));
});
