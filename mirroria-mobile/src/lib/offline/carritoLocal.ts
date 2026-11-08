import type { BaseLocal } from './baseLocal';

export interface ItemLocal {
  varianteId: string;
  cantidad: number;
}

type Dueña = { tienda: string; usuarioId: string };

export async function listarCarrito(db: BaseLocal, { tienda, usuarioId }: Dueña): Promise<ItemLocal[]> {
  return db.consultar<ItemLocal>(
    'SELECT variante_id AS varianteId, cantidad FROM carrito_local WHERE tienda = ? AND usuario_id = ? ORDER BY variante_id',
    [tienda, usuarioId],
  );
}

export async function agregarAlCarrito(db: BaseLocal, d: Dueña, item: ItemLocal): Promise<ItemLocal[]> {
  await db.ejecutar(
    `INSERT INTO carrito_local (tienda, usuario_id, variante_id, cantidad) VALUES (?, ?, ?, ?)
     ON CONFLICT (tienda, usuario_id, variante_id) DO UPDATE SET cantidad = cantidad + excluded.cantidad`,
    [d.tienda, d.usuarioId, item.varianteId, item.cantidad],
  );
  return listarCarrito(db, d);
}

export async function quitarDelCarrito(db: BaseLocal, d: Dueña, varianteId: string): Promise<ItemLocal[]> {
  await db.ejecutar('DELETE FROM carrito_local WHERE tienda = ? AND usuario_id = ? AND variante_id = ?', [
    d.tienda, d.usuarioId, varianteId,
  ]);
  return listarCarrito(db, d);
}

/** Cambios hechos sin red: mientras existan, el carrito del teléfono manda sobre el del servidor. */
export async function marcarCambiosLocales(db: BaseLocal, d: Dueña): Promise<void> {
  await db.ejecutar('INSERT OR IGNORE INTO carrito_estado (tienda, usuario_id) VALUES (?, ?)', [d.tienda, d.usuarioId]);
}

export async function tieneCambiosLocales(db: BaseLocal, d: Dueña): Promise<boolean> {
  const filas = await db.consultar('SELECT 1 FROM carrito_estado WHERE tienda = ? AND usuario_id = ?', [d.tienda, d.usuarioId]);
  return filas.length > 0;
}

export async function vaciarCarrito(db: BaseLocal, d: Dueña): Promise<void> {
  await db.ejecutar('DELETE FROM carrito_local WHERE tienda = ? AND usuario_id = ?', [d.tienda, d.usuarioId]);
  await db.ejecutar('DELETE FROM carrito_estado WHERE tienda = ? AND usuario_id = ?', [d.tienda, d.usuarioId]);
}

/** La foto del carrito del servidor: sin red se sigue desde acá. */
export async function reemplazarCarrito(db: BaseLocal, d: Dueña, items: ItemLocal[]): Promise<void> {
  await db.ejecutar('DELETE FROM carrito_local WHERE tienda = ? AND usuario_id = ?', [d.tienda, d.usuarioId]);
  for (const item of items) await agregarAlCarrito(db, d, item);
}
