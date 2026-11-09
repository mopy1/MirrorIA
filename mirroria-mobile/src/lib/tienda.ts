import { storage } from './storage';

const CLAVE = 'mirroria_tienda';
const POR_DEFECTO = process.env.EXPO_PUBLIC_TIENDA ?? 'tiendaria';

let actual = POR_DEFECTO;
const oyentes = new Set<(slug: string) => void>();

/** Slug de la tienda en la que está la app (cabecera `X-Tenant` de toda ruta de negocio). */
export function tiendaActual(): string {
  return actual;
}

/** Lee la tienda guardada; se llama una vez al abrir la app, antes de la primera petición. */
export async function cargarTienda(): Promise<string> {
  const guardada = await storage.getItem(CLAVE);
  if (guardada) actual = guardada;
  return actual;
}

/** Cambia de tienda y la recuerda. Quien la cambie debe cerrar la sesión de la tienda anterior. */
export async function cambiarTienda(slug: string): Promise<void> {
  actual = slug;
  await storage.setItem(CLAVE, slug);
  oyentes.forEach((fn) => fn(slug));
}

export function alCambiarTienda(fn: (slug: string) => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
