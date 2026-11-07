import { obtenerDb } from '../sqlite-local';

/** Claves de `configuracion_sync` (clave/valor). */
export type ClaveConfig =
  | 'tienda_slug'
  | 'tienda_json'
  | 'directorio_json'
  | 'modo_sin_red'
  | `ultimo_sync_espejo:${string}`;

export async function leerConfig(clave: ClaveConfig): Promise<string | null> {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM configuracion_sync WHERE clave = ?', clave);
  return fila?.valor ?? null;
}

export async function escribirConfig(clave: ClaveConfig, valor: string): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(
    `INSERT INTO configuracion_sync (clave, valor, actualizado_en) VALUES (?, ?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en`,
    clave, valor, Date.now(),
  );
}

export async function borrarConfig(clave: ClaveConfig): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('DELETE FROM configuracion_sync WHERE clave = ?', clave);
}

export async function leerConfigJson<T>(clave: ClaveConfig): Promise<T | null> {
  const v = await leerConfig(clave);
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}
