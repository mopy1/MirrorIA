import type { Cifra } from "./lienzo-cifras"

const dosDigitos = (n: number) => String(n).padStart(2, "0")

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** "hoy 10:50" · "ayer 18:05" · "04/11 09:12". */
export function cuandoSeGenero(generadoEn: Date, ahora = new Date()): string {
  const hora = `${dosDigitos(generadoEn.getHours())}:${dosDigitos(generadoEn.getMinutes())}`
  if (mismoDia(generadoEn, ahora)) return `hoy ${hora}`
  const ayer = new Date(ahora)
  ayer.setDate(ahora.getDate() - 1)
  if (mismoDia(generadoEn, ayer)) return `ayer ${hora}`
  return `${dosDigitos(generadoEn.getDate())}/${dosDigitos(generadoEn.getMonth() + 1)} ${hora}`
}

/** Línea de metadatos del encabezado: cuándo se armó y de dónde salen los datos. */
export function metadatosReporte(opts: { generadoEn?: Date; esSimulacion?: boolean; conIa: boolean; ahora?: Date }): string {
  const partes: string[] = []
  if (opts.generadoEn) partes.push(`Generado ${cuandoSeGenero(opts.generadoEn, opts.ahora)}`)
  if (opts.esSimulacion) partes.push("escenario simulado sobre tus datos reales")
  else partes.push(opts.conIa ? "análisis de la IA con datos reales de tu tienda" : "datos reales de tu tienda")
  const linea = partes.join(" · ")
  return linea.charAt(0).toUpperCase() + linea.slice(1)
}

/** Resumen en texto plano para pegar en WhatsApp o un correo. */
export function textoParaCopiar(titulo: string, conclusion: string | null, cifras: Cifra[]): string {
  const lineas = [titulo]
  if (conclusion) lineas.push("", conclusion)
  if (cifras.length > 0) {
    lineas.push("")
    for (const c of cifras) lineas.push(`- ${c.etiqueta}: ${c.valor}${c.detalle ? ` (${c.detalle})` : ""}`)
  }
  return lineas.join("\n")
}
