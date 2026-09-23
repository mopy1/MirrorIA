export interface RectanguloRecorte {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Qué rectángulo del video hay que tomar para llenar el destino sin
 * deformar, igual que hace `object-fit: cover` en pantalla.
 *
 * La foto que se descarga tiene que salir igual a lo que la clienta vio en
 * el `<video>`: si se dibujara el cuadro entero estirado, un video 4:3 o
 * 16:9 (lo normal en una cámara) hacia un recuadro 3:4 la dejaría deformada.
 */
export function recorteCover(
  anchoVideo: number,
  altoVideo: number,
  anchoDestino: number,
  altoDestino: number,
): RectanguloRecorte {
  const escalaVideo = anchoVideo / altoVideo
  const escalaDestino = anchoDestino / altoDestino

  if (escalaVideo > escalaDestino) {
    // El video es relativamente más ancho que el destino: sobra a los
    // costados, se recorta el ancho y se toma el alto entero.
    const sh = altoVideo
    const sw = altoVideo * escalaDestino
    return { sx: (anchoVideo - sw) / 2, sy: 0, sw, sh }
  }

  // El video es relativamente más alto que el destino (o coinciden): sobra
  // arriba y abajo, se recorta el alto y se toma el ancho entero.
  const sw = anchoVideo
  const sh = anchoVideo / escalaDestino
  return { sx: 0, sy: (altoVideo - sh) / 2, sw, sh }
}
