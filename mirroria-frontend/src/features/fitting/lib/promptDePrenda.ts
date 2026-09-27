import type { Producto } from "@/features/catalog/types/catalog.types"

/**
 * Arma el prompt que le pide a Decart (modelo `lucy-vton-3.5`) que vista a
 * la clienta con esta prenda. Se manda en inglés a propósito: la guía de
 * prompting de VTON 3.5 documenta el patrón "Substitute the current X
 * with..." en inglés, y no hay evidencia de que el modelo lo entienda igual
 * de bien en español. El título/descripción del producto (que sí puede
 * tener nombres propios en español) se manda tal cual — el modelo lee texto
 * libre, no hace falta traducirlos.
 */
export function promptDePrenda(producto: Producto, categoriaNombre?: string): string {
  const objeto = categoriaNombre ? categoriaNombre.toLowerCase() : "outfit"
  const detalle = producto.descripcion?.trim()
  return `Substitute the current ${objeto} with: ${producto.titulo}.${detalle ? ` ${detalle}` : ""}`
}
