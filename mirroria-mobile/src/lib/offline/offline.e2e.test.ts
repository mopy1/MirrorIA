import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { prepararBase, type BaseLocal } from './baseLocal';
import { agregarAlCarrito, listarCarrito, tieneCambiosLocales, vaciarCarrito } from './carritoLocal';
import { encolar, sincronizar, type Operacion } from './outboxLocal';

/**
 * Dos teléfonos sin red contra el backend real. Solo corre con QA_API, QA_TIENDA,
 * QA_SUCURSAL y QA_VARIANTE, más un token por clienta (ver mirroria-qa).
 */
const QA = process.env.QA_API;

function telefono(): BaseLocal {
  const sqlite = new DatabaseSync(':memory:');
  return {
    ejecutar: async (sql, p = []) => { sqlite.prepare(sql).run(...p); },
    consultar: async <T,>(sql: string, p: (string | number | null)[] = []) => sqlite.prepare(sql).all(...p) as T[],
  };
}

const enviarCon = (token: string) => async (op: Operacion) => {
  const r = await fetch(`${QA}${op.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': op.clave, 'X-Tenant': op.tienda, Authorization: `Bearer ${token}` },
    body: op.payload,
  });
  return { status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> };
};

describe.runIf(QA)('dos teléfonos compran la última unidad sin internet', () => {
  it('uno compra y al otro se le revierte, sin duplicar', async () => {
    const tienda = process.env.QA_TIENDA!;
    const sucursalId = process.env.QA_SUCURSAL!;
    const varianteId = process.env.QA_VARIANTE!;
    const personas = [
      { db: telefono(), usuarioId: process.env.QA_U1!, token: process.env.QA_T1! },
      { db: telefono(), usuarioId: process.env.QA_U2!, token: process.env.QA_T2! },
    ];

    for (const p of personas) {
      await prepararBase(p.db);
      const d = { tienda, usuarioId: p.usuarioId };
      await agregarAlCarrito(p.db, d, { varianteId, cantidad: 1 });
      const items = await listarCarrito(p.db, d);
      await encolar(p.db, d, {
        id: randomUUID(), clave: randomUUID(), tipo: 'COMPRA',
        endpoint: `/ventas/carrito/${p.usuarioId}/checkout`,
        payload: { sucursalId, canal: 'MOVIL', items },
      });
      await vaciarCarrito(p.db, d);
    }

    const [a, b] = personas;
    const ra = await sincronizar(a.db, { tienda, usuarioId: a.usuarioId, enviar: enviarCon(a.token) });
    const rb = await sincronizar(b.db, { tienda, usuarioId: b.usuarioId, enviar: enviarCon(b.token) });

    expect(ra).toEqual({ enviadas: 1, compensadas: 0 });
    expect(rb).toEqual({ enviadas: 0, compensadas: 1 });
    expect(await listarCarrito(b.db, { tienda, usuarioId: b.usuarioId })).toEqual([{ varianteId, cantidad: 1 }]);
    expect(await tieneCambiosLocales(b.db, { tienda, usuarioId: b.usuarioId })).toBe(true);

    // La misma operación reenviada: la clave devuelve la misma venta.
    const [op] = await a.db.consultar<Operacion>('SELECT * FROM outbox');
    const repetida = await enviarCon(a.token)(op);
    const original = JSON.parse(op.respuesta!) as { id: string };
    expect(repetida.body.id).toBe(original.id);
  });
});
