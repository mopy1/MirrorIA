import * as Crypto from 'expo-crypto';
import { SQL_CREAR_AVISO, SQL_LISTAR_AVISOS, type FilaAvisoSql } from '@/lib/avisos/sql-avisos';
import { obtenerDb } from '../sqlite-local';
import type { ProductoDto } from '../tipos-espejo';

export interface AvisoLocal {
  id: string;
  varianteId: string;
  creadoEn: number;
  notificadoEn: number | null;
  /** null si la prenda ya no está en el espejo. */
  productoId: string | null;
  prenda: string | null;
  talla: string | null;
  color: string | null;
  imagen: string | null;
  libre: number;
  sucursalConStock: string | null;
}

const aAviso = (f: FilaAvisoSql): AvisoLocal => ({
  id: f.id, varianteId: f.variante_id, creadoEn: f.creado_en, notificadoEn: f.notificado_en, productoId: f.producto_id,
  prenda: f.prenda, talla: f.talla, color: f.color, libre: f.libre, sucursalConStock: f.sucursal_con_stock,
  imagen: f.payload_json ? ((JSON.parse(f.payload_json) as ProductoDto).imagenes[0]?.url ?? null) : null,
});

export async function listarAvisos(tenantId: string): Promise<AvisoLocal[]> {
  const db = await obtenerDb();
  return (await db.getAllAsync<FilaAvisoSql>(SQL_LISTAR_AVISOS, tenantId)).map(aAviso);
}

export async function crearAviso(tenantId: string, varianteId: string): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(SQL_CREAR_AVISO, Crypto.randomUUID(), tenantId, varianteId, Date.now(), tenantId, varianteId);
}

export async function quitarAviso(id: string): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('DELETE FROM avisos_local WHERE id = ?', id);
}

/** `notificado_en`: un número = ya se avisó; null = armado (esperando la reposición). */
export async function marcarAvisos(ids: string[], notificadoEn: number | null): Promise<void> {
  if (ids.length === 0) return;
  const db = await obtenerDb();
  await db.runAsync(`UPDATE avisos_local SET notificado_en = ? WHERE id IN (${ids.map(() => '?').join(',')})`, notificadoEn, ...ids);
}
