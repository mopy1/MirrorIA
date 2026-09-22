import type { ImagenProducto } from '@/src/features/catalog/types/catalog.types';

/**
 * La imagen de portada es la de menor `orden`, no una marcada "esPrincipal"
 * — ese campo nunca existió en el backend real (el campo real es
 * `esArAsset`, que marca cuál imagen sirve de referencia para el vestidor AR,
 * no cuál mostrar primero).
 */
export function getPrimaryImageUrl(imagenes?: ImagenProducto[]): string | undefined {
  if (!imagenes || imagenes.length === 0) return undefined;
  return [...imagenes].sort((a, b) => a.orden - b.orden)[0]?.url;
}
