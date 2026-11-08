import assert from 'node:assert/strict';
import { test } from 'node:test';
import { horariosReserva } from './horarios.ts';

// 2026-11-07 14:10 en La Paz = 18:10 UTC
const AHORA = Date.UTC(2026, 10, 7, 18, 10);

test('primer horario ≥ ahora + 30 min, redondeado a la media hora, en hora de La Paz', () => {
  const h = horariosReserva(AHORA);
  assert.equal(h[0].iso, '2026-11-07T15:00:00-04:00');
  assert.equal(h[0].dia, 'Hoy');
});

test('solo de 10:00 a 20:00 y nunca más allá de +48 h', () => {
  const h = horariosReserva(AHORA);
  assert.ok(h.every((x) => x.hora >= '10:00' && x.hora < '20:00'));
  assert.ok(h.every((x) => x.ms <= AHORA + 48 * 3_600_000));
  assert.equal(h.at(-1)?.iso, '2026-11-09T14:00:00-04:00');
  assert.deepEqual([...new Set(h.map((x) => x.dia))], ['Hoy', 'Mañana', 'Pasado mañana']);
});
