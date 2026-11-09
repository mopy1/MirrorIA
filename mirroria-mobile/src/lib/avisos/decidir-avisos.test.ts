import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decidirAvisos, estadoAviso } from './decidir-avisos.ts';

test('0 → >0: el aviso armado se notifica', () => {
  assert.deepEqual(decidirAvisos([{ id: 'a', notificadoEn: null, libre: 2 }]), { notificar: ['a'], rearmar: [] });
});

test('sigue en 0: no pasa nada', () => {
  assert.deepEqual(decidirAvisos([{ id: 'a', notificadoEn: null, libre: 0 }]), { notificar: [], rearmar: [] });
});

test('ya notificado y con stock: no se repite la notificación en cada sync', () => {
  assert.deepEqual(decidirAvisos([{ id: 'a', notificadoEn: 1000, libre: 5 }]), { notificar: [], rearmar: [] });
});

test('se volvió a agotar: se re-arma para la próxima reposición', () => {
  assert.deepEqual(decidirAvisos([{ id: 'a', notificadoEn: 1000, libre: 0 }]), { notificar: [], rearmar: ['a'] });
});

test('libre negativo (outbox local por encima del snapshot) cuenta como agotado', () => {
  assert.deepEqual(decidirAvisos([{ id: 'a', notificadoEn: null, libre: -1 }]).notificar, []);
});

test('varias filas a la vez', () => {
  const d = decidirAvisos([
    { id: 'a', notificadoEn: null, libre: 1 },
    { id: 'b', notificadoEn: null, libre: 0 },
    { id: 'c', notificadoEn: 5, libre: 0 },
    { id: 'd', notificadoEn: 5, libre: 3 },
  ]);
  assert.deepEqual(d, { notificar: ['a'], rearmar: ['c'] });
});

test('estado visible', () => {
  assert.equal(estadoAviso({ libre: 0 }), 'ESPERANDO');
  assert.equal(estadoAviso({ libre: 2 }), 'VOLVIO');
});
