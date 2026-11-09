import { obtenerDb } from '../sqlite-local';

/** Variante de una etiqueta escaneada, desde el espejo SQLite (sirve sin red, D10). */
export async function buscarPorSku(tenantId: string, sku: string): Promise<{ productoId: string; varianteId: string } | null> {
  const db = await obtenerDb();
  const f = await db.getFirstAsync<{ producto_id: string; id: string }>(
    `SELECT v.producto_id, v.id FROM variantes_local v JOIN catalogo_local c ON c.id = v.producto_id
      WHERE v.tenant_id = ? AND UPPER(v.sku) = ? AND v.activo = 1 LIMIT 1`,
    tenantId, sku.toUpperCase(),
  );
  return f ? { productoId: f.producto_id, varianteId: f.id } : null;
}
