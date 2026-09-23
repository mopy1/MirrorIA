/** Un punto de pose normalizado 0-1, como los devuelve MediaPipe. */
export interface PuntoPose {
  x: number
  y: number
  visibility: number
}

/** Dónde cae, dentro del PNG de la prenda, la línea de anclaje: qué fracción
 * de su ancho equivale a la distancia real entre los dos puntos del cuerpo, y
 * en qué punto de la imagen (0-1) cae el medio de esa línea. */
export interface AnclaPrenda {
  shoulderWidthFraction: number
  anchorX: number
  anchorY: number
}

export interface TransformPrenda {
  visible: boolean
  left: number
  top: number
  width: number
  height: number
  rotationDeg: number
}

/** La misma convención que respeta el móvil (`STANDARD_GARMENT_ANCHOR`): la
 * línea de anclaje cae al 65 % del ancho, centrada, al 24 % de la altura. Los
 * recortes se generan normalizados a esto, así el mismo PNG sirve en las dos
 * plataformas. */
export const ANCLA_ESTANDAR: AnclaPrenda = {
  shoulderWidthFraction: 0.65,
  anchorX: 0.5,
  anchorY: 0.24,
}

/** Por debajo de esto el detector no está seguro de que el punto se vea
 * (tapado, fuera de cuadro): se oculta la prenda en vez de anclarla mal. */
export const VISIBILIDAD_MINIMA = 0.5

const OCULTA: TransformPrenda = {
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  rotationDeg: 0,
}

/**
 * Distancia entre los dos puntos → escala; punto medio → posición; ángulo de
 * la línea que los une → rotación.
 *
 * Portada de `computeGarmentTransform` del móvil. Es genérica a propósito:
 * recibe dos puntos, no «hombros». Para una falda o un pantalón se le pasan
 * las caderas y funciona igual (ver `parDeAnclaje.ts`).
 */
export function calcularTransformPrenda(
  izquierdo: PuntoPose | undefined,
  derecho: PuntoPose | undefined,
  anchoContenedor: number,
  altoContenedor: number,
  espejado: boolean,
  anchoImagen: number,
  altoImagen: number,
  ancla: AnclaPrenda,
): TransformPrenda {
  if (!izquierdo || !derecho) return OCULTA
  if (izquierdo.visibility < VISIBILIDAD_MINIMA || derecho.visibility < VISIBILIDAD_MINIMA) {
    return OCULTA
  }

  // Sin espejar, los parámetros vienen en orden de pantalla (derecho a derecha, izquierdo a izquierda);
  // se intercambian para que la lógica de atan2 funcione igual en ambos casos.
  if (!espejado) {
    [izquierdo, derecho] = [derecho, izquierdo]
  }

  // El cuadro crudo no está espejado, pero el preview de la cámara frontal sí:
  // se espeja acá para que la prenda caiga donde la clienta se ve.
  const izqX = (espejado ? 1 - izquierdo.x : izquierdo.x) * anchoContenedor
  const derX = (espejado ? 1 - derecho.x : derecho.x) * anchoContenedor
  const izqY = izquierdo.y * altoContenedor
  const derY = derecho.y * altoContenedor

  const anchoEntrePuntos = Math.hypot(derX - izqX, derY - izqY)
  const medioX = (izqX + derX) / 2
  const medioY = (izqY + derY) / 2

  const escala = anchoEntrePuntos / (anchoImagen * ancla.shoulderWidthFraction)
  const width = anchoImagen * escala
  const height = altoImagen * escala

  // El -180° al espejar: al invertir x también se invierte el orden
  // izquierda/derecha en pantalla, y sin esa corrección "nivelado" daría 180°.
  // Sin espejar NO va (en el móvil se confirmó en vivo que deja la prenda casi
  // al revés).
  const rotacionRad = Math.atan2(izqY - derY, izqX - derX) - (espejado ? Math.PI : 0)

  return {
    visible: true,
    left: medioX - ancla.anchorX * width,
    top: medioY - ancla.anchorY * height,
    width,
    height,
    rotationDeg: (rotacionRad * 180) / Math.PI,
  }
}
