import type { PrendaProbable } from '@/lib/probador/prendas';
import { obtenerDb } from '../sqlite-local';
import type { ProductoDto } from '../tipos-espejo';

/** Prendas de la vitrina (espejo SQLite) para la tira del probador, con su foto y descripción. */
export async function listarPrendasProbador(tenantId: string): Promise<PrendaProbable[]> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{ id: string; nombre: string; categoria: string | null; payload_json: string }>(
    'SELECT id, nombre, categoria, payload_json FROM catalogo_local WHERE tenant_id = ? ORDER BY nombre',
    tenantId,
  );
  return filas.map((f) => {
    const p = JSON.parse(f.payload_json) as ProductoDto;
    const imagen = [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.url ?? null;
    return { id: f.id, nombre: f.nombre, categoria: f.categoria, descripcion: p.descripcion, imagen };
  });
}
