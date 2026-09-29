import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

/**
 * Prompt para Decart (`lucy-vton-3.5`), igual que en la web
 * (`mirroria-frontend/src/features/fitting/lib/promptDePrenda.ts`): en inglés,
 * con el patrón "Substitute the current X with..." de la guía de VTON 3.5.
 */
export function promptDePrenda(producto: ProductoResponseDto, categoriaNombre?: string): string {
  const objeto = categoriaNombre ? categoriaNombre.toLowerCase() : 'outfit';
  const detalle = producto.descripcion?.trim();
  return `Substitute the current ${objeto} with: ${producto.titulo}.${detalle ? ` ${detalle}` : ''}`;
}

/** Solo se pueden probar prendas con foto: es la referencia que recibe la IA. */
export function esProbable(producto: ProductoResponseDto): boolean {
  return producto.activo && (producto.imagenes?.length ?? 0) > 0;
}
