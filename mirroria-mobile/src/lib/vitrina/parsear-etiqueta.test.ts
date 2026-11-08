import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsearEtiqueta } from './parsear-etiqueta.ts';

test('acepta el SKU plano y lo normaliza', () => {
  assert.equal(parsearEtiqueta('VFL-M-ROJ'), 'VFL-M-ROJ');
  assert.equal(parsearEtiqueta('  vfl-m-roj \n'), 'VFL-M-ROJ');
});

test('acepta el prefijo mirroria:v: (QR de la etiqueta)', () => {
  assert.equal(parsearEtiqueta('mirroria:v:VFL-M-ROJ'), 'VFL-M-ROJ');
  assert.equal(parsearEtiqueta('MIRRORIA:V:cam-s-neg'), 'CAM-S-NEG');
});

test('acepta un enlace con ?sku= o ?codigo=', () => {
  assert.equal(parsearEtiqueta('https://mirroria.duckdns.org/t/tiendaria?sku=VFL-M-ROJ'), 'VFL-M-ROJ');
  assert.equal(parsearEtiqueta('http://x.bo/e?a=1&codigo=mirroria%3Av%3Avfl-l-azu#top'), 'VFL-L-AZU');
  assert.equal(parsearEtiqueta('https://mirroria.duckdns.org/t/tiendaria'), null);
});

test('rechaza lo que no es una etiqueta', () => {
  for (const malo of ['', '   ', null, undefined, 'A', 'hola mundo', 'MRR-ABC12345 x', 'Ñandú', 'X'.repeat(61), '-VFL']) {
    assert.equal(parsearEtiqueta(malo), null, String(malo));
  }
});

test('el código del Pase de Tienda no se confunde con una prenda si tiene espacios', () => {
  assert.equal(parsearEtiqueta('RES 1234'), null);
});
