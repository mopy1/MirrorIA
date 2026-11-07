import { obtenerDb } from '../sqlite-local';
import type { ProductoDto } from '../tipos-espejo';

export interface ItemCarritoLocal {
  varianteId: string;
  cantidad: number;
  productoId: string;
  nombre: string;
  precioCents: number;
  talla: string;
  color: string;
  imagen: string | null;
}

/** Último carrito del servidor guardado en el espejo (para verlo sin red). */
export async function listarCarritoLocal(tenantId: string, usuarioId: string): Promise<ItemCarritoLocal[]> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{ variante_id: string; cantidad: number; producto_id: string; nombre: string; precio_cents: number; talla: string; color: string; payload_json: string }>(
    `SELECT k.variante_id, k.cantidad, v.producto_id, c.nombre, c.precio_cents, v.talla, v.color, c.payload_json
       FROM carrito_local k JOIN variantes_local v ON v.id = k.variante_id JOIN catalogo_local c ON c.id = v.producto_id
      WHERE k.tenant_id = ? AND k.usuario_id = ? ORDER BY k.guardado_en`,
    tenantId, usuarioId,
  );
  return filas.map((f) => {
    const p = JSON.parse(f.payload_json) as ProductoDto;
    return {
      varianteId: f.variante_id, cantidad: f.cantidad, productoId: f.producto_id, nombre: f.nombre,
      precioCents: f.precio_cents, talla: f.talla, color: f.color, imagen: p.imagenes[0]?.url ?? null,
    };
  });
}
