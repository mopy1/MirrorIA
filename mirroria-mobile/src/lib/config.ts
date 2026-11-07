/** URLs de entorno (EXPO_PUBLIC_* se incrustan al empaquetar). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:8080';

/** Las marcas guardan imágenes relativas (`/images/...`) servidas por la web. */
export function urlImagen(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${WEB_URL}${url}` : url;
}

/** TTL del espejo SQLite: 7 días (Fase3 §5, CU46 4a). */
export const TTL_ESPEJO_MS = 7 * 24 * 60 * 60 * 1000;
