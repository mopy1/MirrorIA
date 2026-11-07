import type { BaseLocal } from './baseLocal';

export const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

function sinRed(error: unknown): boolean {
  return (error as { status?: number })?.status === 0;
}

/** Va a la red y guarda; sin red entrega lo guardado de esa tienda si tiene menos de 7 días. */
export async function conCatalogoLocal<T>(
  db: BaseLocal,
  tienda: string,
  clave: string,
  traer: () => Promise<T>,
  ahora = Date.now(),
): Promise<T> {
  const id = `${tienda}:${clave}`;
  try {
    const datos = await traer();
    await db.ejecutar(
      'INSERT OR REPLACE INTO catalogo_cache (clave, tienda, datos, guardado_en) VALUES (?, ?, ?, ?)',
      [id, tienda, JSON.stringify(datos), ahora],
    );
    return datos;
  } catch (error) {
    if (!sinRed(error)) throw error;
    const [fila] = await db.consultar<{ datos: string; guardado_en: number }>(
      'SELECT datos, guardado_en FROM catalogo_cache WHERE clave = ?',
      [id],
    );
    if (!fila || ahora - fila.guardado_en > VIGENCIA_MS) throw error;
    return JSON.parse(fila.datos) as T;
  }
}
