import { recorteCover } from "./recorteCover"

export interface ProyeccionCover {
  escala: number
  anchoMostrado: number
  altoMostrado: number
  /** Dónde cae el borde izquierdo/superior del video ya agrandado, en
   * píxeles del contenedor. Negativo cuando `object-cover` recorta ese lado
   * (el caso normal): el video sobresale y hay que restarle ese sobrante. */
  offsetX: number
  offsetY: number
}

/**
 * Dónde y con qué escala se dibuja el video dentro del contenedor cuando se
 * usa `object-fit: cover`: el video se agranda hasta tapar el recuadro y lo
 * que sobra se recorta, mitad de cada lado.
 *
 * Es la misma cuenta que `recorteCover`, mirada del otro lado: en vez de
 * devolver qué rectángulo del video ORIGINAL hay que tomar (en píxeles de
 * cámara, para recortar), devuelve dónde cae el video COMPLETO ya agrandado
 * (en píxeles del contenedor, para posicionar algo anclado a un punto del
 * video sin recortar). Se apoya en `recorteCover` para no repetir la
 * comparación de relaciones de aspecto: la escala es el ancho del
 * contenedor sobre el ancho recortado que devuelve esa función (da lo mismo
 * usar el alto sobre el alto recortado: por construcción son la misma
 * escala), y los offsets son ese recorte de origen convertido a esa escala,
 * en negativo —lo que se recortó de un lado es exactamente lo que sobresale
 * de ese lado una vez agrandado el video entero—.
 *
 * Por qué hace falta: los landmarks de pose vienen en fracciones (0-1) del
 * cuadro COMPLETO de la cámara, no de lo que `object-cover` deja visible. Si
 * se los multiplica directo por el tamaño del contenedor visible, salen mal
 * ubicados y mal escalados en cuanto la cámara y el contenedor no comparten
 * relación de aspecto (el caso normal: cámara horizontal, escena vertical).
 */
export function proyeccionCover(
  anchoVideo: number,
  altoVideo: number,
  anchoContenedor: number,
  altoContenedor: number,
): ProyeccionCover {
  const { sx, sy, sw } = recorteCover(anchoVideo, altoVideo, anchoContenedor, altoContenedor)
  const escala = anchoContenedor / sw
  return {
    escala,
    anchoMostrado: anchoVideo * escala,
    altoMostrado: altoVideo * escala,
    offsetX: -sx * escala,
    offsetY: -sy * escala,
  }
}
