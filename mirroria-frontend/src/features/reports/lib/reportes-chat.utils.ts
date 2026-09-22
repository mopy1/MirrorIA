const PATRONES_META = [
  /que\s*(podes|puedes|sabes)\s*hacer/,
  /en\s*que\s*(me\s*)?(podes|puedes)\s*ayudar/,
  /que\s*(preguntas?|cosas?)\s*(te\s*)?puedo\s*(preguntar|hacer)/,
  /^\s*ayuda\s*$/,
  /como\s*(te\s*)?uso/,
  /^\s*(hola|hey|hi)\s*[.!]?\s*$/,
]

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/**
 * Preguntas del tipo "¿qué podés hacer?" no necesitan ir hasta el modelo:
 * se responden al toque, gratis, y funcionan aunque no haya `IA_API_KEY`
 * configurada (mismo espíritu que la vía manual sin IA del backend). El
 * texto del dominio se copia a mano del mensaje real de
 * `ConsultaNoComprendidaException` (mirroria-backend, modulo ia) — si ese
 * mensaje cambia ahí, conviene revisar este también.
 */
export function respuestaMeta(texto: string): string | null {
  const normalizado = normalizar(texto)
  if (!PATRONES_META.some((patron) => patron.test(normalizado))) return null
  return (
    "Soy tu asistente de reportes. Puedo responder preguntas sobre ventas, " +
    "inventario, reservas, cupones, compras, usuarios, productos, sucursales " +
    "o proveedores — siempre con números reales de la base de datos, nunca " +
    'inventados. Por ejemplo: "¿Cuánto vendí este mes por sucursal?", ' +
    '"Top 5 productos más vendidos" o "¿Cuántas reservas se cancelaron?".'
  )
}

/** Título corto para el tab del reporte nuevo — la pregunta tal cual la
 * escribió o dictó el usuario, recortada. Preferido antes que derivarlo de
 * `ficha.metrica` porque no depende de mantener un mapa de 18 métricas a
 * etiquetas humanas sincronizado con el backend. */
export function tituloDesdeTexto(texto: string, limite = 32): string {
  const limpio = texto.trim().replace(/\s+/g, " ")
  if (limpio.length <= limite) return limpio
  return `${limpio.slice(0, limite - 1).trimEnd()}…`
}
