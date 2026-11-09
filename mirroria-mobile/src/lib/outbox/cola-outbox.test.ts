// `npm test`: OutboxManager (núcleo) contra SQLite real en memoria (node:sqlite) y un servidor falso.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { MIGRACIONES } from '../db/migraciones.ts';
import { ColaOutbox } from './cola-outbox.ts';
import { listarEventos, obtenerFila } from './repo-outbox.ts';
import type { BaseSql, FilaOutbox, RespuestaEnvio } from './tipos.ts';

type P = (string | number | null)[];
function adaptador(db: DatabaseSync): BaseSql {
  const a: BaseSql = {
    run: async (sql, p: P = []) => void db.prepare(sql).run(...p),
    all: async <T>(sql: string, p: P = []) => db.prepare(sql).all(...p) as T[],
    transaccion: async (fn) => {
      db.exec('BEGIN');
      try {
        await fn(a);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return a;
}

/** Tienda t1, Centro (s1) con 1 unidad de v1 y Sur (s2) con 3. */
function montar(respuestas: (RespuestaEnvio | ((f: FilaOutbox) => RespuestaEnvio))[]) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  for (const m of MIGRACIONES) sqlite.exec(m.sql);
  sqlite.exec(`INSERT INTO stock_local VALUES ('t1','v1','s1',1,0,0,0), ('t1','v1','s2',3,0,0,0)`);
  sqlite.exec(`INSERT INTO carrito_local VALUES ('t1','u1','v1',1,0)`);
  let reloj = 1_000_000;
  const enviados: { id: string; clave: string }[] = [];
  const cola = new ColaOutbox({
    db: adaptador(sqlite),
    uuid: randomUUID,
    ahora: () => reloj,
    azar: () => 0.5,
    enviar: async (f) => {
      enviados.push({ id: f.id, clave: f.idempotencyKey });
      const r = respuestas.shift();
      if (!r) throw new Error('el servidor falso no esperaba otra request');
      return typeof r === 'function' ? r(f) : r;
    },
  });
  const libre = (suc: string) =>
    (sqlite.prepare(`SELECT libre FROM v_stock_libre WHERE variante_id='v1' AND sucursal_id=?`).get(suc) as { libre: number }).libre;
  const avanzar = (ms: number) => void (reloj += ms);
  return { cola, db: adaptador(sqlite), sqlite, enviados, libre, avanzar };
}

const ok = (cuerpo: Record<string, unknown> = { id: 'venta-1' }, cache: string | null = 'MISS'): RespuestaEnvio => ({ status: 201, cuerpo, cache });
const err = (status: number, cuerpo: Record<string, unknown> | null = null): RespuestaEnvio => ({ status, cuerpo, cache: null });
const conflicto = err(409, {
  codigo: 'STOCK_AGOTADO_CONFLICTO',
  message: 'Stock insuficiente',
  detalles: { varianteId: 'v1', sucursalId: 's1', alternativas: { otrasSucursales: [{ sucursalId: 's2', sucursalNombre: 'Sur', disponible: 3 }] } },
});

const checkout = (cola: ColaOutbox, grupoId: string | null = null, sucursalId = 's1') =>
  cola.encolar({
    tenantId: 't1', usuarioId: 'u1', tipo: 'CHECKOUT', endpoint: '/ventas/carrito/u1/checkout',
    payload: { sucursalId, canal: 'MOVIL' }, descripcion: 'Compra', grupoId,
    items: [{ varianteId: 'v1', sucursalId, cantidad: 1, efecto: 'DESCUENTA' }],
  });
const agregar = (cola: ColaOutbox, grupoId: string) =>
  cola.encolar({ tenantId: 't1', usuarioId: 'u1', tipo: 'CARRITO_AGREGAR', endpoint: '/ventas/carrito/u1/items', payload: { varianteId: 'v2', cantidad: 1 }, descripcion: 'Agregar', grupoId });

test('encolar descuenta el stock libre (optimista) y CONFIRMADA lo pasa al snapshot y vacía el carrito', async () => {
  const t = montar([ok()]);
  const f = await checkout(t.cola);
  assert.equal(t.libre('s1'), 0, 'PENDIENTE descuenta');
  const r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.confirmadas.length, 1);
  assert.equal((await obtenerFila(t.db, f.id))?.estado, 'CONFIRMADA');
  assert.equal(t.libre('s1'), 0, 'el snapshot local ahora dice 0');
  assert.equal((t.sqlite.prepare('SELECT COUNT(*) AS n FROM carrito_local').get() as { n: number }).n, 0);
});

test('5xx o sin red: queda PENDIENTE con backoff 2-4-8 s y reintenta con la MISMA clave', async () => {
  const t = montar([err(503), err(0), ok()]);
  const f = await checkout(t.cola);
  let r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.reintentoEn, 2000);
  assert.equal((await t.cola.procesar('t1', 'u1')).reintentoEn, 2000, 'sin esperar el backoff no se envía');
  assert.equal(t.enviados.length, 1);
  t.avanzar(2000);
  r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.reintentoEn, 4000);
  r = await t.cola.procesar('t1', 'u1', true); // "Sincronizar ahora" ignora la espera
  assert.equal(r.confirmadas.length, 1);
  assert.deepEqual(new Set(t.enviados.map((e) => e.clave)), new Set([f.idempotencyKey]));
  assert.equal((await obtenerFila(t.db, f.id))?.reintentos, 2);
});

test('FIFO estricto: si la primera no sale, la segunda no se envía', async () => {
  const t = montar([err(500)]);
  const a = await checkout(t.cola);
  await checkout(t.cola, null, 's2');
  await t.cola.procesar('t1', 'u1');
  assert.deepEqual(t.enviados.map((e) => e.id), [a.id]);
});

test('409 STOCK_AGOTADO_CONFLICTO → COMPENSADA, stock repuesto, alternativas y nunca se reenvía', async () => {
  const t = montar([conflicto, ok()]);
  const f = await checkout(t.cola);
  const otra = await checkout(t.cola, null, 's2');
  const r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.conflictos.length, 1);
  assert.equal(r.conflictos[0].detalle.alternativas?.otrasSucursales?.[0].sucursalNombre, 'Sur');
  assert.equal((await obtenerFila(t.db, f.id))?.estado, 'COMPENSADA');
  assert.equal(t.libre('s1'), 1, 'compensar devuelve la unidad local');
  assert.equal((await obtenerFila(t.db, otra.id))?.estado, 'CONFIRMADA', 'el ciclo sigue con la siguiente');
  await t.cola.procesar('t1', 'u1');
  assert.equal(t.enviados.length, 2, 'la COMPENSADA no se vuelve a mandar');
  assert.deepEqual((await listarEventos(t.db, f.id)).map((e) => e.estado), ['PENDIENTE', 'ENVIANDO', 'COMPENSADA']);
});

test('grupo: si falla "agregar al carrito", el checkout del grupo se cancela sin enviarse', async () => {
  const t = montar([err(409, { message: 'Máximo 3 unidades' })]);
  await agregar(t.cola, 'g1');
  const c = await checkout(t.cola, 'g1');
  const r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.rechazadas.length, 1);
  const fila = await obtenerFila(t.db, c.id);
  assert.equal(fila?.estado, 'RECHAZADA');
  assert.match(fila?.ultimoError ?? '', /falló el paso anterior/);
  assert.equal(t.enviados.length, 1);
  assert.equal(t.libre('s1'), 1);
});

test('409 IDEMPOTENCIA_EN_CURSO → sigue PENDIENTE y reintenta con la misma clave', async () => {
  const t = montar([err(409, { codigo: 'IDEMPOTENCIA_EN_CURSO' }), ok(undefined, 'HIT')]);
  const f = await checkout(t.cola);
  assert.equal((await t.cola.procesar('t1', 'u1')).reintentoEn, 2000);
  assert.equal((await obtenerFila(t.db, f.id))?.estado, 'PENDIENTE');
  t.avanzar(2000);
  await t.cola.procesar('t1', 'u1');
  const fin = await obtenerFila(t.db, f.id);
  assert.equal(fin?.estado, 'CONFIRMADA');
  assert.equal(fin?.cacheIdempotencia, 'HIT');
  assert.equal(t.enviados[0].clave, t.enviados[1].clave);
});

test('401 pausa la cola sin contar reintento; otro 4xx → RECHAZADA y sigue', async () => {
  const t = montar([err(401), err(400, { message: ['sucursalId debe ser uuid'] }), ok()]);
  const a = await checkout(t.cola);
  const r = await t.cola.procesar('t1', 'u1');
  assert.equal(r.pausada, true);
  assert.equal((await obtenerFila(t.db, a.id))?.reintentos, 0);
  await checkout(t.cola, null, 's2');
  const r2 = await t.cola.procesar('t1', 'u1');
  assert.equal(r2.rechazadas[0]?.ultimoError, 'sucursalId debe ser uuid');
  assert.equal(r2.confirmadas.length, 1);
});

test('ENVIANDO al arrancar vuelve a PENDIENTE; la cola solo manda lo de esa clienta y tienda', async () => {
  const t = montar([ok(undefined, 'HIT')]);
  const f = await checkout(t.cola);
  t.sqlite.prepare(`UPDATE outbox_local SET estado='ENVIANDO' WHERE id=?`).run(f.id);
  assert.equal(await t.cola.recuperarEnviando(), 1);
  assert.equal((await t.cola.procesar('t1', 'otra-clienta')).confirmadas.length, 0);
  assert.equal((await t.cola.procesar('t2', 'u1')).confirmadas.length, 0);
  assert.equal((await t.cola.procesar('t1', 'u1')).confirmadas.length, 1);
  assert.equal(t.enviados.length, 1);
});

test('CONFIRMADA de "agregar" copia al carrito local lo que devolvió el servidor', async () => {
  const t = montar([ok({ id: 'c', usuarioId: 'u1', items: [{ varianteId: 'v1', cantidad: 1 }, { varianteId: 'v2', cantidad: 1 }] })]);
  await agregar(t.cola, 'g1');
  await t.cola.procesar('t1', 'u1');
  const n = (t.sqlite.prepare(`SELECT COUNT(*) AS n FROM carrito_local WHERE usuario_id='u1'`).get() as { n: number }).n;
  assert.equal(n, 2);
});
