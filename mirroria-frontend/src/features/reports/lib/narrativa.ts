/**
 * La IA devuelve la narrativa en markdown y suele repetir los datos como tabla GFM
 * (que la pantalla ya muestra como tabla real) y un título "## Top 5…" igual a la pregunta.
 * Estas funciones puras la preparan para mostrarla sin duplicados y sacan piezas clave.
 */

const LINEA_TABLA = /^\s*\|.*\|\s*$/

/** Saca tablas markdown y el primer encabezado (duplica el título del reporte). */
export function limpiarNarrativa(md: string | null | undefined): string {
  if (!md) return ""
  const lineas = md.replace(/\r\n/g, "\n").split("\n").filter((l) => !LINEA_TABLA.test(l))
  const iPrimerTitulo = lineas.findIndex((l) => l.trim().length > 0)
  if (iPrimerTitulo >= 0 && /^#{1,3}\s/.test(lineas[iPrimerTitulo])) lineas.splice(iPrimerTitulo, 1)
  return lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** Markdown inline → texto plano (negritas, cursivas, código, links). */
export function textoPlano(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parrafos(md: string): string[] {
  return limpiarNarrativa(md)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^#{1,6}\s/.test(p) && !/^\s*([-*+]|\d+\.)\s/.test(p))
}

/** Primera idea del análisis, en texto plano y recortada: la "conclusión" del reporte. */
export function extraerConclusion(md: string | null | undefined, limite = 260): string | null {
  if (!md) return null
  // Se saltean las frases de introducción ("Resultado de la consulta:") y la pregunta final;
  // si solo quedan listas, vale el primer punto de la lista.
  const primero = parrafos(md).find((p) => !/[?:]$/.test(p.trim())) ?? primerItemDeLista(md)
  if (!primero) return null
  const plano = textoPlano(primero)
  if (plano.length <= limite) return plano
  const corte = plano.slice(0, limite)
  const finFrase = corte.lastIndexOf(". ")
  return finFrase > limite * 0.5 ? corte.slice(0, finFrase + 1) : `${corte.trimEnd()}…`
}

function primerItemDeLista(md: string): string | undefined {
  const item = limpiarNarrativa(md)
    .split("\n")
    .find((l) => /^\s*([-*+]|\d+\.)\s+\S/.test(l))
  return item?.replace(/^\s*([-*+]|\d+\.)\s+/, "")
}

/** Si la IA termina ofreciendo seguir ("¿Querés que…?"), esa pregunta, para mostrarla como sugerencia. */
export function extraerPreguntaFinal(md: string | null | undefined): string | null {
  if (!md) return null
  const ultimo = parrafos(md).at(-1)
  return ultimo && ultimo.endsWith("?") ? textoPlano(ultimo) : null
}

/** Narrativa sin la pregunta final (se muestra aparte como sugerencia). */
export function narrativaSinPreguntaFinal(md: string | null | undefined): string {
  const limpio = limpiarNarrativa(md)
  const final = extraerPreguntaFinal(md)
  if (!final) return limpio
  const bloques = limpio.split(/\n\s*\n/)
  if (bloques.length > 0 && bloques.at(-1)!.trim().endsWith("?")) bloques.pop()
  return bloques.join("\n\n").trim()
}
