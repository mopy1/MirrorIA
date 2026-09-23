import type { Producto } from "@/features/catalog/types/catalog.types"

/** Solo se pueden probar las prendas que tienen recorte cargado. */
export function prendasProbables(productos: Producto[]): Producto[] {
  return productos.filter((p) => Boolean(p.arOverlayImageUrl))
}

/**
 * Qué prenda se pone al abrir. Un id inexistente —o el de un producto sin
 * recorte— abre el probador con la tira esperando, no con un error: la
 * clienta pudo llegar por un enlace viejo.
 *
 * `fallidas` son los ids cuyo PNG ya dio error en esta sesión: si el id
 * pedido está ahí, tampoco se elige. Sin esto, cuando el recorte de la
 * prenda del enlace no carga, el efecto que la vuelve a pedir la elegiría
 * de nuevo —siempre la misma, rota— en un bucle sin salida.
 */
export function elegirPrendaInicial(
  productos: Producto[],
  id?: string,
  fallidas?: ReadonlySet<string>,
): Producto | null {
  if (!id || fallidas?.has(id)) return null
  return prendasProbables(productos).find((p) => p.id === id) ?? null
}
