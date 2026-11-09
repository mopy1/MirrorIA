import type { SQLiteDatabase } from 'expo-sqlite';
import { obtenerDb, transaccionExclusiva } from '@/lib/db/sqlite-local';
import type { BaseSql } from './tipos';

/** `BaseSql` sobre expo-sqlite: transacciones exclusivas y serializadas (`transaccionExclusiva`). */
function adaptar(db: SQLiteDatabase, enTx = false): BaseSql {
  return {
    run: async (sql, p = []) => void (await db.runAsync(sql, p)),
    all: (sql, p = []) => db.getAllAsync(sql, p),
    // Dentro de una transacción se reutiliza la misma (no se anida otra exclusiva).
    transaccion: (fn) => (enTx ? fn(adaptar(db, true)) : transaccionExclusiva((tx) => fn(adaptar(tx, true)))),
  };
}

let base: Promise<BaseSql> | null = null;
export const sqlOutbox = (): Promise<BaseSql> => (base ??= obtenerDb().then(adaptar));
