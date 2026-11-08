// Corre con `npm test` (node:test + node:sqlite, sin dependencias). Valida la migración v1
// y la vista v_stock_libre del descuento optimista derivado (D5, spec §4.2).
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { MIGRACIONES } from './migraciones.ts';

function base() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const m of MIGRACIONES) db.exec(m.sql);
  db.exec(`INSERT INTO stock_local VALUES ('t1','v1','s1',5,1,0,0), ('t1','v1','s2',2,0,0,0)`);
  return db;
}

const libre = (db: DatabaseSync, suc: string) =>
  (db.prepare(`SELECT libre FROM v_stock_libre WHERE variante_id='v1' AND sucursal_id=?`).get(suc) as { libre: number }).libre;

function encolar(db: DatabaseSync, id: string, estado: string, cantidad: number) {
  db.prepare(`INSERT INTO outbox_local (id, tenant_id, usuario_id, idempotency_key, tipo, endpoint, metodo, payload_json, estado, creado_en)
              VALUES (?, 't1', 'u1', ?, 'CHECKOUT', '/x', 'POST', '{}', ?, 0)`).run(id, `k-${id}`, estado);
  db.prepare(`INSERT INTO outbox_items VALUES (?, 'v1', 's1', ?, 'DESCUENTA')`).run(id, cantidad);
}

test('v1 crea todas las tablas de la spec', () => {
  const db = base();
  const tablas = (db.prepare(`SELECT name FROM sqlite_master WHERE type IN ('table','view')`).all() as { name: string }[]).map((t) => t.name);
  for (const t of ['catalogo_local', 'variantes_local', 'stock_local', 'sucursales_local', 'carrito_local', 'outbox_local', 'outbox_items', 'configuracion_sync', 'avisos_local', 'v_stock_libre']) {
    assert.ok(tablas.includes(t), `falta ${t}`);
  }
});

test('libre = disponible − reservada sin outbox', () => {
  const db = base();
  assert.equal(libre(db, 's1'), 4);
  assert.equal(libre(db, 's2'), 2);
});

test('PENDIENTE y ENVIANDO descuentan; CONFIRMADA/COMPENSADA/RECHAZADA no', () => {
  const db = base();
  encolar(db, 'o1', 'PENDIENTE', 1);
  encolar(db, 'o2', 'ENVIANDO', 2);
  assert.equal(libre(db, 's1'), 1);
  db.exec(`UPDATE outbox_local SET estado='COMPENSADA' WHERE id='o2'`);
  assert.equal(libre(db, 's1'), 3, 'compensar devuelve las unidades solas');
  db.exec(`UPDATE outbox_local SET estado='RECHAZADA' WHERE id='o1'`);
  assert.equal(libre(db, 's1'), 4);
  assert.equal(libre(db, 's2'), 2, 'otra sucursal no se toca');
});

test('estado inválido de la outbox es rechazado por el CHECK', () => {
  const db = base();
  assert.throws(() => encolar(db, 'o3', 'SINCRONIZADO', 1));
});
