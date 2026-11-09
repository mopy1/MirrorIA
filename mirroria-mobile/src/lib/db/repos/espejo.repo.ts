import { transaccionExclusiva } from '../sqlite-local';
import type { SnapshotEspejo } from '../tipos-espejo';

/**
 * Reemplaza el espejo de UNA tienda en una sola transacción (spec §4.3 paso 5):
 * si algo falla, queda el espejo anterior entero.
 */
export async function reemplazarEspejo(tenantId: string, s: SnapshotEspejo): Promise<void> {
  const ahora = Date.now();
  const nombreCategoria = new Map(s.categorias.map((c) => [c.id, c.nombre]));
  const ordenTalla = new Map(s.tallas.map((t) => [t.id, t.orden]));

  await transaccionExclusiva(async (tx) => {
    for (const tabla of ['stock_local', 'variantes_local', 'catalogo_local', 'sucursales_local']) {
      await tx.runAsync(`DELETE FROM ${tabla} WHERE tenant_id = ?`, tenantId);
    }
    for (const su of s.sucursales) {
      await tx.runAsync(
        'INSERT INTO sucursales_local (id, tenant_id, nombre, ciudad, direccion, telefono, activo) VALUES (?,?,?,?,?,?,?)',
        su.id, tenantId, su.nombre, su.ciudadNombre, su.direccion, su.telefono, su.activo ? 1 : 0,
      );
    }
    for (const p of s.productos.filter((x) => x.activo)) {
      await tx.runAsync(
        'INSERT INTO catalogo_local (id, tenant_id, nombre, precio_cents, categoria, payload_json, guardado_en) VALUES (?,?,?,?,?,?,?)',
        p.id, tenantId, p.titulo, p.precioCents, nombreCategoria.get(p.categoriaId ?? '') ?? null, JSON.stringify(p), ahora,
      );
      for (const v of p.variantes ?? []) {
        await tx.runAsync(
          `INSERT INTO variantes_local (id, tenant_id, producto_id, sku, talla, talla_orden, color, color_hex, activo)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          v.id, tenantId, p.id, v.sku, v.tallaNombre, ordenTalla.get(v.tallaId) ?? 0, v.colorNombre, v.colorHex, v.activo ? 1 : 0,
        );
      }
    }
    for (const i of s.inventario) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO stock_local (tenant_id, variante_id, sucursal_id, disponible, reservada, en_transito, guardado_en)
         VALUES (?,?,?,?,?,?,?)`,
        tenantId, i.varianteId, i.sucursalId, i.cantidadDisponible, i.cantidadReservada, i.cantidadEnTransito, ahora,
      );
    }
    if (s.carrito) {
      await tx.runAsync('DELETE FROM carrito_local WHERE tenant_id = ? AND usuario_id = ?', tenantId, s.carrito.usuarioId);
      for (const it of s.carrito.dto.items) {
        await tx.runAsync(
          'INSERT INTO carrito_local (tenant_id, usuario_id, variante_id, cantidad, guardado_en) VALUES (?,?,?,?,?)',
          tenantId, s.carrito.usuarioId, it.varianteId, it.cantidad, ahora,
        );
      }
    }
    await tx.runAsync(
      `INSERT INTO configuracion_sync (clave, valor, actualizado_en) VALUES (?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en`,
      `ultimo_sync_espejo:${tenantId}`, String(ahora), ahora,
    );
  });
}
