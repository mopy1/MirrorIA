import * as SQLite from 'expo-sqlite';
import { prepararBase, type BaseLocal } from './baseLocal';

let base: Promise<BaseLocal> | null = null;

/** La base del teléfono. Se abre una sola vez. */
export function baseLocal(): Promise<BaseLocal> {
  base ??= (async () => {
    const db = await SQLite.openDatabaseAsync('mirroria.db');
    const local: BaseLocal = {
      ejecutar: async (sql, params = []) => { await db.runAsync(sql, params); },
      consultar: (sql, params = []) => db.getAllAsync(sql, params),
    };
    await prepararBase(local);
    return local;
  })();
  return base;
}
