import { obtenerDb } from '../sqlite-local';

export interface SucursalReservable {
  sucursalId: string;
  nombre: string;
  ciudad: string;
  libre: number;
  /** Lo que el backend deja apartar: min(libre, ⌈disponible × 0,5⌉ − reservada − lo encolado). */
  reservable: number;
}

/** Sucursales activas con el stock de esa variante (espejo + outbox), para elegir dónde probarse. */
export async function sucursalesParaReservar(tenantId: string, varianteId: string): Promise<SucursalReservable[]> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{ id: string; nombre: string; ciudad: string; disponible: number | null; reservada: number | null; libre: number | null }>(
    `SELECT su.id, su.nombre, su.ciudad, s.disponible, s.reservada, l.libre
       FROM sucursales_local su
       LEFT JOIN stock_local s ON s.sucursal_id = su.id AND s.variante_id = ? AND s.tenant_id = su.tenant_id
       LEFT JOIN v_stock_libre l ON l.sucursal_id = su.id AND l.variante_id = ? AND l.tenant_id = su.tenant_id
      WHERE su.tenant_id = ? AND su.activo = 1 ORDER BY su.nombre`,
    varianteId, varianteId, tenantId,
  );
  return filas.map((f) => {
    const disponible = f.disponible ?? 0;
    const reservada = f.reservada ?? 0;
    const libre = Math.max(f.libre ?? 0, 0);
    const encolado = Math.max(disponible - reservada - (f.libre ?? 0), 0);
    return { sucursalId: f.id, nombre: f.nombre, ciudad: f.ciudad, libre, reservable: Math.max(Math.min(libre, Math.ceil(disponible * 0.5) - reservada - encolado), 0) };
  });
}
