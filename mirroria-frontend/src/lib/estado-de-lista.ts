/** En qué estado está una sección que muestra una lista traída del servidor.
 *
 * Existe porque el inicio tenía dos secciones (categorías y contacto) que
 * hacían `items.map(...)` a secas: con la lista vacía no dibujaban NADA y
 * quedaba el título flotando sobre un hueco mudo, sin decirle al visitante
 * qué pasó. La distinción que importa es entre "todavía no llegó" y "llegó
 * vacío": son mensajes distintos. */
export type EstadoDeLista = "cargando" | "vacio" | "con-datos"

export function estadoDeLista({
  isLoading,
  cantidad,
}: {
  isLoading: boolean
  cantidad: number
}): EstadoDeLista {
  if (isLoading) return "cargando"
  return cantidad === 0 ? "vacio" : "con-datos"
}
