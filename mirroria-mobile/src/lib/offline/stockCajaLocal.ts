import type { BaseLocal } from './baseLocal';

/** Una prenda (variante) a la venta en la caja: espejo de ItemMostradorDto del backend. */
export interface ItemCaja {
  varianteId: string;
  productoId: string;
  titulo: string;
  talla: string;
  color: string;
  sku: string;
  precioCents: number;
  disponible: number;
}

export interface FotoStock {
  items: ItemCaja[];
  guardadoEn: number;
}

/** Igual que el catálogo de la clienta y que el servidor (acepta ventas de hasta 7 días). */
export const VIGENCIA_STOCK_MS = 7 * 24 * 60 * 60 * 1000;

interface FilaStock {
  variante_id: string;
  producto_id: string;
  titulo: string;
  talla: string;
  color: string;
  sku: string;
  precio_cents: number;
  disponible: number;
}

/** Reemplaza la foto entera de la sucursal: lo que ya no vino del servidor deja de venderse. */
export async function guardarStockCaja(
  db: BaseLocal,
  tienda: string,
  sucursalId: string,
  items: ItemCaja[],
  ahora = Date.now(),
): Promise<void> {
  await db.ejecutar('DELETE FROM stock_caja WHERE tienda = ? AND sucursal_id = ?', [tienda, sucursalId]);
  for (const i of items) {
    await db.ejecutar(
      `INSERT INTO stock_caja (tienda, sucursal_id, variante_id, producto_id, titulo, talla, color, sku, precio_cents, disponible, guardado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tienda, sucursalId, i.varianteId, i.productoId, i.titulo, i.talla, i.color, i.sku, i.precioCents, i.disponible, ahora],
    );
  }
  await db.ejecutar('INSERT OR REPLACE INTO stock_caja_foto (tienda, sucursal_id, guardado_en) VALUES (?, ?, ?)', [
    tienda, sucursalId, ahora,
  ]);
}

/** La foto guardada de la sucursal, o null si nunca se abrió la caja ahí con internet. */
export async function leerStockCaja(db: BaseLocal, tienda: string, sucursalId: string): Promise<FotoStock | null> {
  const [foto] = await db.consultar<{ guardado_en: number }>(
    'SELECT guardado_en FROM stock_caja_foto WHERE tienda = ? AND sucursal_id = ?',
    [tienda, sucursalId],
  );
  if (!foto) return null;
  const filas = await db.consultar<FilaStock>(
    'SELECT * FROM stock_caja WHERE tienda = ? AND sucursal_id = ? ORDER BY titulo, talla, color',
    [tienda, sucursalId],
  );
  return {
    guardadoEn: foto.guardado_en,
    items: filas.map((f) => ({
      varianteId: f.variante_id,
      productoId: f.producto_id,
      titulo: f.titulo,
      talla: f.talla,
      color: f.color,
      sku: f.sku,
      precioCents: f.precio_cents,
      disponible: f.disponible,
    })),
  };
}

export function fotoVencida(foto: FotoStock, ahora = Date.now()): boolean {
  return ahora - foto.guardadoEn > VIGENCIA_STOCK_MS;
}
