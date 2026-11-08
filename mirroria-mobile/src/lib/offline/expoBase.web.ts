import { prepararBase, type BaseLocal } from './baseLocal';

// En el navegador (solo para ver la app en la PC) no hay SQLite: expo-sqlite web no compila con
// la salida estática. Base vacía: la app anda en línea y no guarda nada sin conexión. El teléfono usa expoBase.ts.
let base: Promise<BaseLocal> | null = null;

export function baseLocal(): Promise<BaseLocal> {
  base ??= (async () => {
    const local: BaseLocal = { ejecutar: async () => {}, consultar: async () => [] };
    await prepararBase(local);
    return local;
  })();
  return base;
}
