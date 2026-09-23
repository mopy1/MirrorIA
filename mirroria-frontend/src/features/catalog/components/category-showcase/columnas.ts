/** Cuántas columnas usa la grilla de categorías del inicio, en pantalla grande.
 *
 * Estaba fija en 5 y el catálogo tiene tantas categorías como quiera el
 * administrador: con 6 dejaba una sola tarjeta huérfana en la segunda fila, y
 * con 4 —que es como quedó el catálogo al sacar calzado y accesorios— dejaba
 * un hueco a la derecha. Que siga a la cantidad real resuelve los dos casos.
 *
 * Las clases van escritas enteras a propósito: Tailwind lee el código fuente
 * para decidir qué CSS generar, así que una clase armada con plantillas
 * (`lg:grid-cols-${n}`) no existiría en la hoja de estilos.
 */
const COLUMNAS: Record<number, string> = {
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
}

export function columnasParaCategorias(cantidad: number): string {
  // Menos de 4 no baja de 4: una tarjeta sola ocupando media pantalla se ve
  // peor que una fila corta.
  const columnas = Math.min(Math.max(cantidad, 4), 6)
  return COLUMNAS[columnas]
}
