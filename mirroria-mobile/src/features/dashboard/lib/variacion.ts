export type DireccionVariacion = "sube" | "baja" | "igual" | "sin_anterior" | "sin_datos"

export interface VariacionHumana {
  direccion: DireccionVariacion
  /** Frase lista para mostrar: "18% más que el período anterior". */
  texto: string
  tono: "bien" | "mal" | "neutro"
}

interface OpcionesVariacion {
  /** Texto cuando el período anterior fue 0 y el actual no (nunca "+100%"). */
  textoSinAnterior?: string
  /** Texto cuando ambos períodos son 0. */
  textoSinDatos?: string
}

/**
 * Traduce una variación a palabras para alguien sin formación técnica.
 * Si el período anterior fue 0, no hay porcentaje honesto que mostrar.
 */
export function describirVariacion(
  actual: number,
  anterior: number,
  variacionPorcentaje: number,
  opciones: OpcionesVariacion = {},
): VariacionHumana {
  if (anterior === 0 && actual === 0) {
    return { direccion: "sin_datos", tono: "neutro", texto: opciones.textoSinDatos ?? "Sin movimiento para comparar" }
  }
  if (anterior === 0) {
    return { direccion: "sin_anterior", tono: "neutro", texto: opciones.textoSinAnterior ?? "Sin ventas en el período anterior" }
  }
  const pct = Math.round(Math.abs(variacionPorcentaje))
  if (pct === 0) return { direccion: "igual", tono: "neutro", texto: "Igual que el período anterior" }
  if (variacionPorcentaje > 0) return { direccion: "sube", tono: "bien", texto: `${pct}% más que el período anterior` }
  return { direccion: "baja", tono: "mal", texto: `${pct}% menos que el período anterior` }
}
