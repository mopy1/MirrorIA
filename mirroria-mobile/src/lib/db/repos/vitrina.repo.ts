import { obtenerDb } from '../sqlite-local';
import type { EstadoEspejo, FichaPrenda, PrendaVitrina, ProductoDto, StockSucursal, VarianteFicha } from '../tipos-espejo';

/** Grilla de la vitrina: SIEMPRE desde SQLite (D3), con stock libre total (v_stock_libre). */
export async function listarPrendas(tenantId: string): Promise<PrendaVitrina[]> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{ id: string; nombre: string; precio_cents: number; categoria: string | null; payload_json: string; libre: number | null; colores: string | null }>(
    `SELECT c.id, c.nombre, c.precio_cents, c.categoria, c.payload_json,
            (SELECT SUM(MAX(s.libre, 0)) FROM v_stock_libre s JOIN variantes_local v ON v.id = s.variante_id
              WHERE v.producto_id = c.id AND s.tenant_id = c.tenant_id) AS libre,
            (SELECT GROUP_CONCAT(DISTINCT v.color_hex) FROM variantes_local v WHERE v.producto_id = c.id AND v.activo = 1) AS colores
       FROM catalogo_local c WHERE c.tenant_id = ? ORDER BY c.nombre`,
    tenantId,
  );
  return filas.map((f) => {
    const p = JSON.parse(f.payload_json) as ProductoDto;
    const imagen = [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.url ?? null;
    return {
      id: f.id, nombre: f.nombre, precioCents: f.precio_cents, categoria: f.categoria, imagen,
      libre: f.libre ?? 0, colores: f.colores ? f.colores.split(',').filter(Boolean) : [],
    };
  });
}

export async function obtenerFicha(tenantId: string, productoId: string): Promise<FichaPrenda | null> {
  const db = await obtenerDb();
  const p = await db.getFirstAsync<{ payload_json: string; categoria: string | null; guardado_en: number }>(
    'SELECT payload_json, categoria, guardado_en FROM catalogo_local WHERE tenant_id = ? AND id = ?', tenantId, productoId,
  );
  if (!p) return null;
  const vars = await db.getAllAsync<{ id: string; sku: string; talla: string; talla_orden: number; color: string; color_hex: string | null }>(
    'SELECT id, sku, talla, talla_orden, color, color_hex FROM variantes_local WHERE producto_id = ? AND activo = 1 ORDER BY talla_orden, talla',
    productoId,
  );
  const stock = await db.getAllAsync<{ variante_id: string; sucursal_id: string; nombre: string; ciudad: string; libre: number }>(
    `SELECT s.variante_id, s.sucursal_id, su.nombre, su.ciudad, MAX(s.libre, 0) AS libre
       FROM v_stock_libre s JOIN sucursales_local su ON su.id = s.sucursal_id AND su.activo = 1
       JOIN variantes_local v ON v.id = s.variante_id
      WHERE s.tenant_id = ? AND v.producto_id = ? ORDER BY su.nombre`,
    tenantId, productoId,
  );
  const porVariante = new Map<string, StockSucursal[]>();
  for (const s of stock) {
    const lista = porVariante.get(s.variante_id) ?? [];
    lista.push({ sucursalId: s.sucursal_id, sucursalNombre: s.nombre, ciudad: s.ciudad, libre: s.libre });
    porVariante.set(s.variante_id, lista);
  }
  const variantes: VarianteFicha[] = vars.map((v) => ({
    id: v.id, sku: v.sku, talla: v.talla, tallaOrden: v.talla_orden, color: v.color, colorHex: v.color_hex,
    stock: porVariante.get(v.id) ?? [],
  }));
  return { producto: JSON.parse(p.payload_json) as ProductoDto, categoria: p.categoria, variantes, guardadoEn: p.guardado_en };
}

export async function estadoEspejo(tenantId: string): Promise<EstadoEspejo> {
  const db = await obtenerDb();
  const n = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM catalogo_local WHERE tenant_id = ?', tenantId);
  const u = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM configuracion_sync WHERE clave = ?', `ultimo_sync_espejo:${tenantId}`);
  return { prendas: n?.n ?? 0, ultimoSync: u ? Number(u.valor) : null };
}
