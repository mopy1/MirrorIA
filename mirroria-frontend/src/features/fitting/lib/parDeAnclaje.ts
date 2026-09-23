/** Índices fijos del esquema MediaPipe/BlazePose (0-32). Son los mismos que
 * usa ML Kit en el móvil, porque ambos derivan del mismo modelo. */
export const INDICE_POSE = {
  HOMBRO_IZQ: 11,
  HOMBRO_DER: 12,
  CADERA_IZQ: 23,
  CADERA_DER: 24,
} as const

const POR_CADERAS = new Set(["pantalones-y-faldas"])

/**
 * Qué dos puntos del cuerpo usa cada prenda para anclarse.
 *
 * Una falda no tiene hombros: si se anclara a ellos quedaría colgando del
 * pecho. Se decide por la categoría del producto y no midiendo la imagen,
 * porque la categoría ya dice inequívocamente si la prenda va arriba o abajo.
 */
export function parDeAnclaje(slugCategoria: string): [number, number] {
  return POR_CADERAS.has(slugCategoria)
    ? [INDICE_POSE.CADERA_IZQ, INDICE_POSE.CADERA_DER]
    : [INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER]
}
