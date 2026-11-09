import { escribirConfig, leerConfigJson, type ClaveConfig } from '@/lib/db/repos/configuracion.repo';
import { ErrorSinRed } from './errores';

export interface ConCache<T> {
  datos: T;
  /** `true` = sin red, se muestra lo último guardado. */
  guardado: boolean;
}

/**
 * Lectura con respaldo en `configuracion_sync`: con red pide y guarda; sin red devuelve lo último
 * (Mis pedidos, Mis reservas y el Pase de Tienda se ven sin señal dentro de la tienda).
 */
export async function conCache<T>(clave: ClaveConfig, pedir: () => Promise<T>): Promise<ConCache<T>> {
  try {
    const datos = await pedir();
    await escribirConfig(clave, JSON.stringify(datos));
    return { datos, guardado: false };
  } catch (e) {
    if (!(e instanceof ErrorSinRed)) throw e;
    const guardado = await leerConfigJson<T>(clave);
    if (guardado === null) throw e;
    return { datos: guardado, guardado: true };
  }
}
