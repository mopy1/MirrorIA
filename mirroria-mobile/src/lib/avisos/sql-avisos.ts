/**
 * SQL de `avisos_local` (sin dependencias de Expo, para testearlo con node:sqlite).
 * `avisos_local` no tiene FK a `variantes_local` a propósito: el espejo se borra y se vuelve a
 * insertar en cada snapshot y los avisos tienen que sobrevivir.
 */
const STOCK = `FROM v_stock_libre s JOIN sucursales_local su ON su.id = s.sucursal_id AND su.activo = 1
  WHERE s.tenant_id = a.tenant_id AND s.variante_id = a.variante_id AND (a.sucursal_id IS NULL OR s.sucursal_id = a.sucursal_id)`;

/** Avisos de una tienda con su prenda (si sigue en el espejo) y el stock libre actual. */
export const SQL_LISTAR_AVISOS = `
SELECT a.id, a.variante_id, a.creado_en, a.notificado_en,
       v.producto_id, v.talla, v.color, c.nombre AS prenda, c.payload_json,
       IFNULL((SELECT SUM(MAX(s.libre, 0)) ${STOCK}), 0) AS libre,
       (SELECT su.nombre ${STOCK} AND s.libre > 0 ORDER BY s.libre DESC, su.nombre LIMIT 1) AS sucursal_con_stock
  FROM avisos_local a
  LEFT JOIN variantes_local v ON v.id = a.variante_id
  LEFT JOIN catalogo_local c ON c.id = v.producto_id
 WHERE a.tenant_id = ?
 ORDER BY a.creado_en DESC`;

/** Crea el aviso si no existe ya uno para esa variante (UNIQUE no frena duplicados con sucursal NULL). */
export const SQL_CREAR_AVISO = `
INSERT INTO avisos_local (id, tenant_id, variante_id, sucursal_id, creado_en, notificado_en)
SELECT ?, ?, ?, NULL, ?, NULL
 WHERE NOT EXISTS (SELECT 1 FROM avisos_local WHERE tenant_id = ? AND variante_id = ?)`;

export interface FilaAvisoSql {
  id: string;
  variante_id: string;
  creado_en: number;
  notificado_en: number | null;
  producto_id: string | null;
  talla: string | null;
  color: string | null;
  prenda: string | null;
  payload_json: string | null;
  libre: number;
  sucursal_con_stock: string | null;
}
