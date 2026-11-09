import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { MIGRACIONES } from '../db/migraciones.ts';
import { decidirAvisos } from './decidir-avisos.ts';
import { SQL_CREAR_AVISO, SQL_LISTAR_AVISOS, type FilaAvisoSql } from './sql-avisos.ts';

function base() {
  const db = new DatabaseSync(':memory:');
  for (const m of MIGRACIONES) db.exec(m.sql);
  db.exec(`INSERT INTO catalogo_local VALUES ('p1','t1','Vestido Floral',25000,NULL,'{"imagenes":[]}',0);
           INSERT INTO variantes_local VALUES ('v1','t1','p1','VFL-M-ROJ','M',2,'Rojo',NULL,1);
           INSERT INTO sucursales_local VALUES ('s1','t1','Sucursal Centro','Tarija',NULL,NULL,1),
                                               ('s2','t1','Sucursal Norte','Tarija',NULL,NULL,1),
                                               ('s3','t1','Cerrada','Tarija',NULL,NULL,0);
           INSERT INTO stock_local VALUES ('t1','v1','s1',0,0,0,0), ('t1','v1','s2',1,1,0,0), ('t1','v1','s3',9,0,0,0);`);
  return db;
}
const crear = (db: DatabaseSync, id: string) => db.prepare(SQL_CREAR_AVISO).run(id, 't1', 'v1', 1, 't1', 'v1');
const listar = (db: DatabaseSync) => db.prepare(SQL_LISTAR_AVISOS).all('t1') as unknown as FilaAvisoSql[];
const filas = (db: DatabaseSync) => listar(db).map((f) => ({ id: f.id, notificadoEn: f.notificado_en, libre: f.libre }));

test('un solo aviso por variante aunque se toque dos veces', () => {
  const db = base();
  crear(db, 'a1');
  crear(db, 'a2');
  assert.equal(listar(db).length, 1);
});

test('agotada (reservada = disponible; la sucursal inactiva no cuenta) → no notifica', () => {
  const db = base();
  crear(db, 'a1');
  const [f] = listar(db);
  assert.equal(f.libre, 0);
  assert.equal(f.prenda, 'Vestido Floral');
  assert.deepEqual(decidirAvisos(filas(db)).notificar, []);
});

test('ajuste positivo en el snapshot (0 → 2) → notifica con la sucursal que tiene stock', () => {
  const db = base();
  crear(db, 'a1');
  db.exec(`UPDATE stock_local SET disponible = 2 WHERE sucursal_id = 's1'`);
  const [f] = listar(db);
  assert.equal(f.libre, 2);
  assert.equal(f.sucursal_con_stock, 'Sucursal Centro');
  assert.deepEqual(decidirAvisos(filas(db)).notificar, ['a1']);
});

test('una compra encolada sin red que se lleva la unidad no dispara el aviso', () => {
  const db = base();
  crear(db, 'a1');
  db.exec(`UPDATE stock_local SET disponible = 1 WHERE sucursal_id = 's1';
           INSERT INTO outbox_local (id, tenant_id, usuario_id, idempotency_key, tipo, endpoint, metodo, payload_json, estado, creado_en)
           VALUES ('o1','t1','u1','k1','CHECKOUT','/x','POST','{}','PENDIENTE',0);
           INSERT INTO outbox_items VALUES ('o1','v1','s1',1,'DESCUENTA');`);
  assert.equal(listar(db)[0].libre, 0);
});

test('el aviso sobrevive al reemplazo del espejo (sin FK a variantes_local)', () => {
  const db = base();
  crear(db, 'a1');
  db.exec(`DELETE FROM variantes_local; DELETE FROM catalogo_local;`);
  const [f] = listar(db);
  assert.equal(f.id, 'a1');
  assert.equal(f.producto_id, null);
});
