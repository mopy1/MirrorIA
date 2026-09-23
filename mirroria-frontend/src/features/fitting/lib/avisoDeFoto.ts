/** Qué pasó al intentar guardar la foto. */
export type ResultadoFoto = "ok" | "sin-prenda" | "fallo" | "camara-no-lista"

export const AVISO_FOTO_FALLIDA = "No pudimos guardar la foto. Probá de nuevo."
export const AVISO_FOTO_SIN_PRENDA =
  "La foto se guardó, pero sin la prenda: no se pudo cargar el recorte."
export const AVISO_FOTO_CAMARA_NO_LISTA =
  "Esperá un segundo: la cámara todavía está arrancando."

const AVISOS_DE_LA_FOTO: ReadonlySet<string> = new Set([
  AVISO_FOTO_FALLIDA,
  AVISO_FOTO_SIN_PRENDA,
  AVISO_FOTO_CAMARA_NO_LISTA,
])

/**
 * Qué aviso queda después de apretar «Sacar foto».
 *
 * Antes el botón no avisaba nada: si algo fallaba, no pasaba nada y la
 * clienta se quedaba mirando. Y hay dos cosas que fallan de verdad: el
 * `toDataURL`/`toBlob` de un canvas contaminado (lanza `SecurityError`) y,
 * la que se ve en desarrollo, que el PNG de la prenda no se pueda volver a
 * pedir con CORS y la foto salga sin nada puesto.
 *
 * Cuando sale todo bien solo se limpia el aviso si el que estaba puesto era
 * de la foto: un «Esa prenda no se pudo cargar» explica por qué la clienta
 * no tiene nada puesto y no hay que borrárselo por sacar una foto.
 */
export function avisoDespuesDeLaFoto(previo: string | null, resultado: ResultadoFoto): string | null {
  switch (resultado) {
    case "fallo":
      return AVISO_FOTO_FALLIDA
    case "sin-prenda":
      return AVISO_FOTO_SIN_PRENDA
    case "camara-no-lista":
      return AVISO_FOTO_CAMARA_NO_LISTA
    case "ok":
      return previo !== null && AVISOS_DE_LA_FOTO.has(previo) ? null : previo
  }
}
