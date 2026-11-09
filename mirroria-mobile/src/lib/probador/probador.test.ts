import assert from 'node:assert/strict';
import { test } from 'node:test';
import { faseProbador, formatoCuenta, type EntradaFase } from './fase-probador.ts';
import { elegirPrenda, promptDePrenda, prendasProbables } from './prendas.ts';

const base: EntradaFase = { online: true, activo: true, motivoPausa: 'inicio', permiso: 'concedido', camara: 'lista', sesion: 'en-vivo' };

test('promptDePrenda: igual que la web (categoría en minúscula, descripción opcional)', () => {
  assert.equal(promptDePrenda({ nombre: 'Vestido Floral', categoria: 'Vestidos', descripcion: ' Largo, de lino. ' }), 'Substitute the current vestidos with: Vestido Floral. Largo, de lino.');
  assert.equal(promptDePrenda({ nombre: 'Jean', categoria: null, descripcion: null }), 'Substitute the current outfit with: Jean.');
});

test('prendasProbables/elegirPrenda: sin foto no se prueba; id pedido o la primera', () => {
  const l = [
    { id: 'a', nombre: 'A', categoria: null, descripcion: null, imagen: null },
    { id: 'b', nombre: 'B', categoria: null, descripcion: null, imagen: 'https://x/b.jpg' },
    { id: 'c', nombre: 'C', categoria: null, descripcion: null, imagen: 'https://x/c.jpg' },
  ];
  assert.deepEqual(prendasProbables(l).map((p) => p.id), ['b', 'c']);
  assert.equal(elegirPrenda(l, 'c')?.id, 'c');
  assert.equal(elegirPrenda(l, 'a')?.id, 'b');
  assert.equal(elegirPrenda(l)?.id, 'b');
  assert.equal(elegirPrenda([]), null);
});

test('faseProbador: prioridad sin red > apagado > permiso > error > cámara > conexión', () => {
  assert.equal(faseProbador({ ...base, online: false }), 'sin-red');
  assert.equal(faseProbador({ ...base, activo: false }), 'inicio');
  assert.equal(faseProbador({ ...base, activo: false, motivoPausa: 'tiempo' }), 'tiempo-cumplido');
  assert.equal(faseProbador({ ...base, permiso: 'desconocido' }), 'permiso');
  assert.equal(faseProbador({ ...base, permiso: 'negado-siempre' }), 'permiso-negado');
  assert.equal(faseProbador({ ...base, sesion: 'error' }), 'error');
  assert.equal(faseProbador({ ...base, camara: 'abriendo', sesion: 'inactiva' }), 'abriendo-camara');
  assert.equal(faseProbador({ ...base, sesion: 'conectando' }), 'conectando');
  assert.equal(faseProbador(base), 'en-vivo');
});

test('formatoCuenta', () => {
  assert.equal(formatoCuenta(60), '1:00');
  assert.equal(formatoCuenta(9.2), '0:10');
  assert.equal(formatoCuenta(-3), '0:00');
});
