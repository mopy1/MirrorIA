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

/**
 * ¿Toca aplicar la prenda del enlace?
 *
 * Solo una vez por enlace. Antes el efecto decía «si no hay prenda puesta y
 * ya llegó el catálogo, poné la del enlace», y eso volvía a dispararse cada
 * vez que la prenda se soltaba: si entrabas por `/probador/A`, elegías B de
 * la tira y el PNG de B fallaba, la pantalla mostraba el cartel rojo «no se
 * pudo cargar» y, al mismo tiempo, la prenda A puesta de nuevo.
 *
 * `marcaAplicada` es el `productoId` que ya se aplicó (cadena vacía si se
 * entró a `/probador` sin id, `null` si todavía no se aplicó nada). Comparar
 * contra el id —y no un booleano— permite que navegar de `/probador/A` a
 * `/probador/B` sin recargar sí ponga la B.
 */
export function debeAplicarPrendaDelEnlace(
  marcaAplicada: string | null,
  productoId: string | undefined,
  catalogoCargado: boolean,
): boolean {
  if (!catalogoCargado) return false
  return marcaAplicada !== (productoId ?? "")
}
