import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { prepararBase, type BaseLocal } from './baseLocal';
import { encolarVenta, sincronizarCaja, ventasFallidasSinAtender, type VentaCaja } from './colaCaja';
import { guardarStockCaja, leerStockCaja, type ItemCaja } from './stockCajaLocal';
import { armarPayload, avisoFallida, cobrar, disponibleLocal } from '../../features/mostrador/lib/venta-caja';
import { vendidoSinReflejar } from './colaCaja';

/**
 * Dos cajas sin red contra el backend real. Corre con QA_API, QA_TIENDA, QA_SUCURSAL, QA_VARIANTE
 * (con stock = 1 en esa sucursal) y dos personas que pueden cobrar: QA_CAJA_U1/QA_CAJA_T1 y
 * QA_CAJA_U2/QA_CAJA_T2 (ver mirroria-qa/movil/caja/e2e.mjs, que prepara todo).
 */
const QA = process.env.QA_API;

function telefono(): BaseLocal {
  const sqlite = new DatabaseSync(':memory:');
  return {
    ejecutar: async (sql, p = []) => { sqlite.prepare(sql).run(...p); },
    consultar: async <T,>(sql: string, p: (string | number | null)[] = []) => sqlite.prepare(sql).all(...p) as T[],
  };
}

const POST = (token: string, tienda: string) => async (cuerpo: string, clave: string) => {
  const r = await fetch(`${QA}/ventas/presenciales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave, 'X-Tenant': tienda, Authorization: `Bearer ${token}` },
    body: cuerpo,
  });
  return { status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> };
};

async function traerStock(token: string, tienda: string, sucursalId: string): Promise<ItemCaja[]> {
  const r = await fetch(`${QA}/inventario/mostrador?sucursalId=${sucursalId}`, {
    headers: { 'X-Tenant': tienda, Authorization: `Bearer ${token}` },
  });
  return (await r.json()) as ItemCaja[];
}

describe.runIf(QA)('caja sin internet contra el backend real', () => {
  it('dos cajas sin red venden la última unidad: una entra, la otra queda FALLIDA; nada se duplica', async () => {
    const tienda = process.env.QA_TIENDA!;
    const sucursalId = process.env.QA_SUCURSAL!;
    const varianteId = process.env.QA_VARIANTE!;
    const cajas = [
      { db: telefono(), c: { tienda, usuarioId: process.env.QA_CAJA_U1! }, token: process.env.QA_CAJA_T1! },
      { db: telefono(), c: { tienda, usuarioId: process.env.QA_CAJA_U2! }, token: process.env.QA_CAJA_T2! },
    ];

    // 1. Con red: cada caja guarda la foto del stock (la última unidad).
    for (const k of cajas) {
      await prepararBase(k.db);
      await guardarStockCaja(k.db, tienda, sucursalId, await traerStock(k.token, tienda, sucursalId));
    }

    // 2. Sin red: cada una cobra la última unidad; queda en su cola.
    for (const k of cajas) {
      const foto = (await leerStockCaja(k.db, tienda, sucursalId))!;
      const prenda = foto.items.find((i) => i.varianteId === varianteId)!;
      expect(prenda.disponible).toBe(1);
      const r = await cobrar(
        { payload: armarPayload(sucursalId, [{ item: prenda, cantidad: 1 }], null, new Date()), resumen: `1 × ${prenda.titulo}`, totalCents: prenda.precioCents },
        {
          enLinea: () => false,
          enviar: () => Promise.reject(new Error('sin red')),
          encolar: (v) => encolarVenta(k.db, k.c, v),
          anotarEnviada: async () => {},
          generarId: randomUUID,
        },
      );
      expect(r.estado).toBe('EN_COLA');
      // En esa caja la prenda ya figura agotada.
      expect(disponibleLocal(prenda, await vendidoSinReflejar(k.db, tienda, sucursalId, foto.guardadoEn))).toBe(0);
    }

    // 3. Vuelve la red: sincronizan una después de la otra.
    const enviarCola = (token: string) => (v: VentaCaja) => POST(token, tienda)(v.payload, v.clave);
    const [a, b] = cajas;
    const ra = await sincronizarCaja(a.db, { ...a.c, enviar: enviarCola(a.token) });
    const rb = await sincronizarCaja(b.db, { ...b.c, enviar: enviarCola(b.token) });
    expect(ra).toEqual({ enviadas: 1, fallidas: 0, pendientes: 0 });
    expect(rb).toEqual({ enviadas: 0, fallidas: 1, pendientes: 0 });

    const [fallida] = await ventasFallidasSinAtender(b.db, b.c);
    expect(fallida.codigo).toBe(409);
    expect(avisoFallida(fallida, (c) => String(c))).toContain('devolvele el dinero');

    // 4. Reenviar la de A (respuesta perdida) devuelve la MISMA venta: no se duplica ni descuenta dos veces.
    const [enviada] = await a.db.consultar<VentaCaja>(`SELECT * FROM cola_caja WHERE estado = 'ENVIADA'`);
    const repetida = await enviarCola(a.token)(enviada);
    expect(repetida.status).toBe(201);
    expect(repetida.body.id).toBe((JSON.parse(enviada.respuesta!) as { id: string }).id);
    const despues = await traerStock(a.token, tienda, sucursalId);
    expect(despues.find((i) => i.varianteId === varianteId)?.disponible).toBe(0);

    // 5. Misma clave con otro cuerpo: el servidor lo rechaza (por eso el cuerpo se arma una sola vez).
    const otroCuerpo = JSON.stringify({ ...JSON.parse(enviada.payload), vendidaEn: new Date().toISOString() });
    const distinto = await POST(a.token, tienda)(otroCuerpo, enviada.clave);
    expect(distinto.status).toBe(422);
  }, 30_000);
});
