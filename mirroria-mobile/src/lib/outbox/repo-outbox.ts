import type { BaseSql, EstadoOutbox, EventoOutbox, FilaOutbox, ItemEfecto } from './tipos.ts';

/** SQL de `outbox_local`, `outbox_items` y `outbox_eventos` sobre cualquier `BaseSql`. */

interface FilaSql {
  id: string; tenant_id: string; usuario_id: string; grupo_id: string | null; idempotency_key: string;
  tipo: FilaOutbox['tipo']; endpoint: string; metodo: FilaOutbox['metodo']; payload_json: string; estado: EstadoOutbox;
  reintentos: number; proximo_intento_en: number | null; codigo_respuesta: number | null; cache_idempotencia: string | null;
  respuesta_json: string | null; ultimo_error: string | null; creado_en: number; sincronizado_en: number | null;
  descripcion: string; meta_json: string | null; envios?: number;
}

const json = <T>(t: string | null, defecto: T): T => {
  try {
    return t ? (JSON.parse(t) as T) : defecto;
  } catch {
    return defecto;
  }
};

export const aFila = (f: FilaSql): FilaOutbox => ({
  id: f.id, tenantId: f.tenant_id, usuarioId: f.usuario_id, grupoId: f.grupo_id, idempotencyKey: f.idempotency_key,
  tipo: f.tipo, endpoint: f.endpoint, metodo: f.metodo, payload: json(f.payload_json, {}), estado: f.estado,
  reintentos: f.reintentos, proximoIntentoEn: f.proximo_intento_en, codigoRespuesta: f.codigo_respuesta,
  cacheIdempotencia: f.cache_idempotencia, respuesta: json(f.respuesta_json, null), ultimoError: f.ultimo_error,
  creadoEn: f.creado_en, sincronizadoEn: f.sincronizado_en, descripcion: f.descripcion, meta: json(f.meta_json, {}),
  envios: f.envios ?? 0,
});

export async function insertarFila(tx: BaseSql, f: FilaOutbox, items: ItemEfecto[]): Promise<void> {
  await tx.run(
    `INSERT INTO outbox_local (id, tenant_id, usuario_id, grupo_id, idempotency_key, tipo, endpoint, metodo, payload_json,
       estado, reintentos, creado_en, descripcion, meta_json) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?)`,
    [f.id, f.tenantId, f.usuarioId, f.grupoId, f.idempotencyKey, f.tipo, f.endpoint, f.metodo, JSON.stringify(f.payload),
      'PENDIENTE', f.creadoEn, f.descripcion, JSON.stringify(f.meta)],
  );
  for (const i of items) {
    await tx.run('INSERT INTO outbox_items (outbox_id, variante_id, sucursal_id, cantidad, efecto) VALUES (?,?,?,?,?)',
      [f.id, i.varianteId, i.sucursalId, i.cantidad, i.efecto]);
  }
}

export async function registrarEvento(tx: BaseSql, id: string, estado: EstadoOutbox, en: number, codigo: number | null, detalle: string | null) {
  await tx.run('INSERT INTO outbox_eventos (outbox_id, estado, en, codigo, detalle) VALUES (?,?,?,?,?)', [id, estado, en, codigo, detalle]);
}

export async function obtenerFila(db: BaseSql, id: string): Promise<FilaOutbox | null> {
  const [f] = await db.all<FilaSql>('SELECT * FROM outbox_local WHERE id = ?', [id]);
  return f ? aFila(f) : null;
}

/** Cabeza de la cola FIFO de esa clienta en esa tienda. */
export async function primeraPendiente(db: BaseSql, tenantId: string, usuarioId: string): Promise<FilaOutbox | null> {
  const [f] = await db.all<FilaSql>(
    `SELECT * FROM outbox_local WHERE tenant_id = ? AND usuario_id = ? AND estado = 'PENDIENTE' ORDER BY creado_en, rowid LIMIT 1`,
    [tenantId, usuarioId],
  );
  return f ? aFila(f) : null;
}

export async function listarFilas(db: BaseSql, tenantId: string): Promise<FilaOutbox[]> {
  const filas = await db.all<FilaSql>(
    `SELECT o.*, (SELECT COUNT(*) FROM outbox_eventos e WHERE e.outbox_id = o.id AND e.estado = 'ENVIANDO') AS envios
       FROM outbox_local o WHERE o.tenant_id = ? ORDER BY o.creado_en DESC, o.rowid DESC`,
    [tenantId],
  );
  return filas.map(aFila);
}

export async function listarEventos(db: BaseSql, id: string): Promise<EventoOutbox[]> {
  return db.all<EventoOutbox>('SELECT estado, en, codigo, detalle FROM outbox_eventos WHERE outbox_id = ? ORDER BY id', [id]);
}

export async function itemsDe(db: BaseSql, id: string): Promise<ItemEfecto[]> {
  return db.all<ItemEfecto>(
    'SELECT variante_id AS varianteId, sucursal_id AS sucursalId, cantidad, efecto FROM outbox_items WHERE outbox_id = ?', [id],
  );
}

/**
 * CONFIRMADA (misma transacción, spec §4.2): DESCUENTA → disponible −= n; RESERVA → reservada += n;
 * CHECKOUT vacía `carrito_local`; CARRITO_AGREGAR copia el carrito que devolvió el servidor.
 */
export async function aplicarConfirmacion(tx: BaseSql, f: FilaOutbox, ahora: number): Promise<void> {
  for (const i of await itemsDe(tx, f.id)) {
    const columna = i.efecto === 'DESCUENTA' ? 'disponible = MAX(disponible - ?, 0)' : 'reservada = reservada + ?';
    await tx.run(`UPDATE stock_local SET ${columna} WHERE tenant_id = ? AND variante_id = ? AND sucursal_id = ?`,
      [i.cantidad, f.tenantId, i.varianteId, i.sucursalId]);
  }
  const items = f.respuesta?.items;
  if (f.tipo === 'CHECKOUT' || (f.tipo === 'CARRITO_AGREGAR' && Array.isArray(items))) {
    await tx.run('DELETE FROM carrito_local WHERE tenant_id = ? AND usuario_id = ?', [f.tenantId, f.usuarioId]);
  }
  if (f.tipo === 'CARRITO_AGREGAR' && Array.isArray(items)) {
    for (const it of items as { varianteId: string; cantidad: number }[]) {
      await tx.run('INSERT OR REPLACE INTO carrito_local (tenant_id, usuario_id, variante_id, cantidad, guardado_en) VALUES (?,?,?,?,?)',
        [f.tenantId, f.usuarioId, it.varianteId, it.cantidad, ahora]);
    }
  }
}

/** Grupos (spec §5.2): lo que sigue de un grupo caído se cancela sin enviarse. */
export async function cancelarRestoDelGrupo(tx: BaseSql, f: FilaOutbox, ahora: number): Promise<number> {
  if (!f.grupoId) return 0;
  const resto = await tx.all<{ id: string }>(
    `SELECT id FROM outbox_local WHERE grupo_id = ? AND id <> ? AND estado = 'PENDIENTE' AND creado_en >= ?`,
    [f.grupoId, f.id, f.creadoEn],
  );
  const motivo = 'Cancelada porque falló el paso anterior';
  for (const r of resto) {
    await tx.run(`UPDATE outbox_local SET estado = 'RECHAZADA', ultimo_error = ? WHERE id = ?`, [motivo, r.id]);
    await registrarEvento(tx, r.id, 'RECHAZADA', ahora, null, motivo);
  }
  // El próximo "agregar" ya no se suma a este grupo.
  await tx.run('DELETE FROM configuracion_sync WHERE clave = ? AND valor = ?', [`grupo_carrito:${f.usuarioId}`, f.grupoId]);
  return resto.length;
}
