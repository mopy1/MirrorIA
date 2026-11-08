import * as SQLite from 'expo-sqlite';
import { MIGRACIONES } from './migraciones';

/** Entidad ICONIX "SQLite Local": un archivo por teléfono, filas separadas por tenant. */
export const NOMBRE_DB = 'mirroria_local.db';

let promesa: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (const m of MIGRACIONES.filter((x) => x.version > actual).sort((a, b) => a.version - b.version)) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(m.sql);
      await txn.execAsync(`PRAGMA user_version = ${m.version}`);
    });
  }
}

let cola: Promise<unknown> = Promise.resolve();
const esBloqueo = (e: unknown) => e instanceof Error && /database is locked|SQLITE_BUSY|code 5/i.test(e.message);

/**
 * Transacción exclusiva SERIALIZADA. `withExclusiveTransactionAsync` abre otra conexión: dos a la
 * vez (outbox + re-snapshot del espejo al reconectar) daban "database is locked". Un candado en JS
 * las pone en fila y, si una escritura suelta de la conexión principal justo ocupa la base, reintenta.
 */
export function transaccionExclusiva(fn: (tx: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
  const correr = async () => {
    const db = await obtenerDb();
    for (let intento = 1; ; intento++) {
      try {
        return await db.withExclusiveTransactionAsync(fn);
      } catch (e) {
        if (!esBloqueo(e) || intento >= 6) throw e;
        await new Promise((r) => setTimeout(r, 80 * intento));
      }
    }
  };
  const p = cola.then(correr, correr);
  cola = p.catch(() => undefined);
  return p;
}

/** Abre (una sola vez) la base y aplica las migraciones pendientes. */
export function obtenerDb(): Promise<SQLite.SQLiteDatabase> {
  promesa ??= SQLite.openDatabaseAsync(NOMBRE_DB).then(async (db) => {
    await migrar(db);
    return db;
  });
  return promesa;
}

export async function versionEsquema(): Promise<number> {
  const db = await obtenerDb();
  return (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
}
