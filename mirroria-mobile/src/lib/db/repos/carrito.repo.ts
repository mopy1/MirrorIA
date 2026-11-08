import { obtenerDb, transaccionExclusiva } from '../sqlite-local';
import type { ProductoDto } from '../tipos-espejo';

export interface ItemCarritoLocal {
  varianteId: string;
  /** Total que verá la clienta: lo del servidor + lo agregado sin confirmar. */
  cantidad: number;
  /** Unidades que todavía están en la outbox ("Pendiente de confirmar"). */
  pendientes: number;
  productoId: string;
  nombre: string;
  precioCents: number;
  talla: string;
  color: string;
  imagen: string | null;
}

/**
 * Carrito que ve la clienta (sin red también): el último del servidor (`carrito_local`)
 * + los `CARRITO_AGREGAR` todavía PENDIENTE/ENVIANDO de la outbox (D5, badge "Pendiente").
 */
export async function listarCarritoLocal(tenantId: string, usuarioId: string): Promise<ItemCarritoLocal[]> {
  const db = await obtenerDb();
  const servidor = await db.getAllAsync<{ variante_id: string; cantidad: number }>(
    'SELECT variante_id, cantidad FROM carrito_local WHERE tenant_id = ? AND usuario_id = ? ORDER BY guardado_en', tenantId, usuarioId,
  );
  const encolados = await db.getAllAsync<{ payload_json: string }>(
    `SELECT payload_json FROM outbox_local WHERE tenant_id = ? AND usuario_id = ? AND tipo = 'CARRITO_AGREGAR'
       AND estado IN ('PENDIENTE','ENVIANDO') ORDER BY creado_en`, tenantId, usuarioId,
  );
  const cantidades = new Map<string, { cantidad: number; pendientes: number }>();
  for (const s of servidor) cantidades.set(s.variante_id, { cantidad: s.cantidad, pendientes: 0 });
  for (const e of encolados) {
    const p = JSON.parse(e.payload_json) as { varianteId: string; cantidad: number };
    const a = cantidades.get(p.varianteId) ?? { cantidad: 0, pendientes: 0 };
    cantidades.set(p.varianteId, { cantidad: a.cantidad + p.cantidad, pendientes: a.pendientes + p.cantidad });
  }
  const items: ItemCarritoLocal[] = [];
  for (const [varianteId, c] of cantidades) {
    const f = await db.getFirstAsync<{ producto_id: string; nombre: string; precio_cents: number; talla: string; color: string; payload_json: string }>(
      `SELECT v.producto_id, c.nombre, c.precio_cents, v.talla, v.color, c.payload_json
         FROM variantes_local v JOIN catalogo_local c ON c.id = v.producto_id WHERE v.id = ?`, varianteId,
    );
    if (!f) continue; // prenda que ya no está en el espejo
    const p = JSON.parse(f.payload_json) as ProductoDto;
    items.push({
      varianteId, cantidad: c.cantidad, pendientes: c.pendientes, productoId: f.producto_id, nombre: f.nombre,
      precioCents: f.precio_cents, talla: f.talla, color: f.color, imagen: p.imagenes[0]?.url ?? null,
    });
  }
  return items;
}

/** Stock libre (v_stock_libre) de esas variantes en cada sucursal activa: para elegir dónde retirar. */
export async function stockParaRetiro(tenantId: string, varianteIds: string[]) {
  if (varianteIds.length === 0) return [];
  const db = await obtenerDb();
  return db.getAllAsync<{ sucursal_id: string; nombre: string; ciudad: string; variante_id: string; libre: number }>(
    `SELECT su.id AS sucursal_id, su.nombre, su.ciudad, v.id AS variante_id, IFNULL(MAX(s.libre, 0), 0) AS libre
       FROM sucursales_local su CROSS JOIN variantes_local v
       LEFT JOIN v_stock_libre s ON s.sucursal_id = su.id AND s.variante_id = v.id AND s.tenant_id = su.tenant_id
      WHERE su.tenant_id = ? AND su.activo = 1 AND v.id IN (${varianteIds.map(() => '?').join(',')})
      ORDER BY su.nombre`,
    tenantId, ...varianteIds,
  );
}

/** Copia el carrito que devolvió el servidor (p. ej. tras quitar un ítem) a `carrito_local`. */
export async function reemplazarCarritoLocal(tenantId: string, usuarioId: string, items: { varianteId: string; cantidad: number }[]) {
  const ahora = Date.now();
  await transaccionExclusiva(async (tx) => {
    await tx.runAsync('DELETE FROM carrito_local WHERE tenant_id = ? AND usuario_id = ?', tenantId, usuarioId);
    for (const it of items) {
      await tx.runAsync(
        'INSERT INTO carrito_local (tenant_id, usuario_id, variante_id, cantidad, guardado_en) VALUES (?,?,?,?,?)',
        tenantId, usuarioId, it.varianteId, it.cantidad, ahora,
      );
    }
  });
}
