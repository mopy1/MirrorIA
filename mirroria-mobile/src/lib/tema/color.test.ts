import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contraste, hexARgb, textoSobre } from './color.ts';

test('textoSobre elige el de mayor contraste (marcas reales)', () => {
  assert.equal(textoSobre('#820025'), '#FFFFFF'); // Tiendaria
  assert.equal(textoSobre('#E3C14B'), '#000000'); // Nómada
  assert.equal(textoSobre('#C3F74C'), '#000000'); // lima MirrorIA
});

test('contraste del índigo de MirrorIA sobre blanco ≥ 4.5', () => {
  assert.ok(contraste('#281B89', '#FFFFFF') >= 4.5);
  assert.deepEqual(hexARgb('#281B89'), [40, 27, 137]);
});
