import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatoBs } from './dinero.ts';

test('formato boliviano: miles con punto, decimales con coma', () => {
  assert.equal(formatoBs(125000), 'Bs 1.250,00');
  assert.equal(formatoBs(18000), 'Bs 180,00');
  assert.equal(formatoBs(5), 'Bs 0,05');
  assert.equal(formatoBs(123456789), 'Bs 1.234.567,89');
});
