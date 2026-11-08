import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clasificarRespuesta, esperaReintento } from './clasificar-respuesta.ts';

test('2xx (MISS o HIT) → CONFIRMADA', () => {
  assert.deepEqual(clasificarRespuesta(201, {}), { estado: 'CONFIRMADA' });
  assert.equal(clasificarRespuesta(200, null).estado, 'CONFIRMADA');
});

test('409 de stock → COMPENSADA; 409 en curso → reintento; otro 409 → RECHAZADA con el mensaje', () => {
  assert.equal(clasificarRespuesta(409, { codigo: 'STOCK_AGOTADO_CONFLICTO' }).estado, 'COMPENSADA');
  assert.deepEqual(clasificarRespuesta(409, { codigo: 'IDEMPOTENCIA_EN_CURSO' }), {
    estado: 'PENDIENTE', accion: 'REINTENTAR', motivo: 'La tienda todavía la está procesando',
  });
  assert.deepEqual(clasificarRespuesta(409, { message: 'El carrito está vacío' }), { estado: 'RECHAZADA', motivo: 'El carrito está vacío' });
});

test('401 y 403 de tienda → pausa; 5xx, 429, 408 y sin red (0) → reintentar', () => {
  assert.equal((clasificarRespuesta(401, null) as { accion: string }).accion, 'PAUSAR');
  assert.equal((clasificarRespuesta(403, { message: 'Tu sesión pertenece a otra tienda' }) as { accion: string }).accion, 'PAUSAR');
  assert.equal(clasificarRespuesta(403, { message: 'Prohibido' }).estado, 'RECHAZADA');
  for (const s of [0, 408, 429, 500, 503]) assert.equal((clasificarRespuesta(s, null) as { accion: string }).accion, 'REINTENTAR');
});

test('422 y validaciones → RECHAZADA (une message[])', () => {
  assert.equal(clasificarRespuesta(422, null).estado, 'RECHAZADA');
  assert.deepEqual(clasificarRespuesta(400, { message: ['a', 'b'] }), { estado: 'RECHAZADA', motivo: 'a. b' });
});

test('backoff 2-4-8-16-30 s con tope y ±20 %', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map((n) => esperaReintento(n, 0.5)), [2000, 4000, 8000, 16000, 30000, 30000]);
  assert.equal(esperaReintento(1, 0), 1600);
  assert.equal(esperaReintento(1, 1), 2400);
});
