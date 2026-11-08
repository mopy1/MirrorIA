import type { SQLiteDatabase } from 'expo-sqlite';
import { obtenerDb } from '@/lib/db/sqlite-local';
import type { BaseSql } from './tipos';

/** `BaseSql` sobre expo-sqlite: la transacción es exclusiva (nadie escribe en el medio). */
function adaptar(db: SQLiteDatabase): BaseSql {
  return {
    run: async (sql, p = []) => void (await db.runAsync(sql, p)),
    all: (sql, p = []) => db.getAllAsync(sql, p),
    transaccion: (fn) => db.withExclusiveTransactionAsync((tx) => fn(adaptar(tx))),
  };
}

let base: Promise<BaseSql> | null = null;
export const sqlOutbox = (): Promise<BaseSql> => (base ??= obtenerDb().then(adaptar));
