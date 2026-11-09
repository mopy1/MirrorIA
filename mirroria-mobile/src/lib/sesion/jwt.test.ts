import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expiracionJwt, jwtVencido } from './jwt.ts';

const jwt = (payload: object) => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;

test('lee exp del payload sin librerías', () => {
  assert.equal(expiracionJwt(jwt({ exp: 1700000000 })), 1700000000);
  assert.equal(expiracionJwt('basura'), null);
});

test('vencido según la hora', () => {
  const t = jwt({ exp: 1000 });
  assert.equal(jwtVencido(t, 999_000), false);
  assert.equal(jwtVencido(t, 1_000_000), true);
});
