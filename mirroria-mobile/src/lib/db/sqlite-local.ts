import * as SQLite from 'expo-sqlite';
import { MIGRACIONES } from './migraciones';

/** Entidad ICONIX "SQLite Local": un archivo por teléfono, filas separadas por tenant. */
export const NOMBRE_DB = 'mirroria_local.db';

let promesa: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (const m of MIGRACIONES.filter((x) => x.version > actual).sort((a, b) => a.version - b.version)) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(m.sql);
      await txn.execAsync(`PRAGMA user_version = ${m.version}`);
    });
  }
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
