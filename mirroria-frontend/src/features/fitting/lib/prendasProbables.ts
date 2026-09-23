import type { Producto } from "@/features/catalog/types/catalog.types"

/** Solo se pueden probar las prendas que tienen recorte cargado. */
export function prendasProbables(productos: Producto[]): Producto[] {
  return productos.filter((p) => Boolean(p.arOverlayImageUrl))
}

/**
 * Qué prenda se pone al abrir. Un id inexistente —o el de un producto sin
 * recorte— abre el probador con la tira esperando, no con un error: la
 * clienta pudo llegar por un enlace viejo.
 */
export function elegirPrendaInicial(productos: Producto[], id?: string): Producto | null {
  if (!id) return null
  return prendasProbables(productos).find((p) => p.id === id) ?? null
}
