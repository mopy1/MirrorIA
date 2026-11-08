import { obtenerDb } from '../sqlite-local';
import type { ProductoDto } from '../tipos-espejo';

export interface PrendaDeVariante {
  productoId: string;
  prenda: string;
  talla: string;
  color: string;
  precioCents: number;
  imagen: string | null;
}

/** Nombres de prendas y sucursales desde el espejo (las respuestas de ventas/reservas solo traen ids). */
export interface Diccionario {
  variantes: Map<string, PrendaDeVariante>;
  sucursales: Map<string, { nombre: string; ciudad: string; direccion: string | null }>;
}

export async function cargarDiccionario(tenantId: string): Promise<Diccionario> {
  const db = await obtenerDb();
  const vars = await db.getAllAsync<{ id: string; talla: string; color: string; producto_id: string; nombre: string; precio_cents: number; payload_json: string }>(
    `SELECT v.id, v.talla, v.color, v.producto_id, c.nombre, c.precio_cents, c.payload_json
       FROM variantes_local v JOIN catalogo_local c ON c.id = v.producto_id WHERE v.tenant_id = ?`,
    tenantId,
  );
  const sucs = await db.getAllAsync<{ id: string; nombre: string; ciudad: string; direccion: string | null }>(
    'SELECT id, nombre, ciudad, direccion FROM sucursales_local WHERE tenant_id = ?',
    tenantId,
  );
  const imagenes = new Map<string, string | null>();
  const variantes = new Map<string, PrendaDeVariante>();
  for (const v of vars) {
    if (!imagenes.has(v.producto_id)) {
      const p = JSON.parse(v.payload_json) as ProductoDto;
      imagenes.set(v.producto_id, [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.url ?? null);
    }
    variantes.set(v.id, { productoId: v.producto_id, prenda: v.nombre, talla: v.talla, color: v.color, precioCents: v.precio_cents, imagen: imagenes.get(v.producto_id) ?? null });
  }
  return { variantes, sucursales: new Map(sucs.map((s) => [s.id, { nombre: s.nombre, ciudad: s.ciudad, direccion: s.direccion }])) };
}
