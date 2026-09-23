export interface SenalesProbador {
  hayCamara: boolean
  /** ¿Ya terminó de cargar el detector de pose? Entre que la cámara arranca
   * y que el modelo está listo pasan varios segundos (17,5 MB de wasm y
   * modelo), y en ese rato no se ve ningún punto: sin esta señal el panel le
   * echaba la culpa a la clienta («No te veo») de una descarga. */
  modeloListo: boolean
  /** Cuántos de los dos puntos de anclaje se ven (0, 1 o 2). */
  puntosVisibles: number
  prendaElegida: boolean
}

export type EstadoPaso = "pendiente" | "activo" | "listo"

export interface PasosProbador {
  camara: EstadoPaso
  ubicacion: EstadoPaso
  prenda: EstadoPaso
  mensaje: string
  completo: boolean
}

/**
 * Traduce señales reales del sistema a los tres pasos del panel guiado.
 *
 * Ningún paso se marca porque la clienta lo diga: la cámara se marca cuando
 * llega el stream, la ubicación cuando el detector ve los dos puntos, y la
 * prenda cuando hay una elegida. Mientras el modelo todavía se está bajando
 * el mensaje lo dice («Preparando el probador…»), en vez de pedirle a la
 * clienta que se acomode por algo que no depende de ella. Si la pose se
 * pierde, el paso 2 se reenciende aunque ya hubiera prenda: así la pantalla
 * nunca queda sin prenda y sin explicación.
 */
export function calcularPasos(s: SenalesProbador): PasosProbador {
  if (!s.hayCamara) {
    return {
      camara: "activo",
      ubicacion: "pendiente",
      prenda: "pendiente",
      mensaje: "Permití la cámara para empezar.",
      completo: false,
    }
  }

  if (!s.modeloListo) {
    return {
      camara: "listo",
      ubicacion: "activo",
      prenda: s.prendaElegida ? "listo" : "pendiente",
      mensaje: "Preparando el probador…",
      completo: false,
    }
  }

  if (s.puntosVisibles < 2) {
    return {
      camara: "listo",
      ubicacion: "activo",
      prenda: s.prendaElegida ? "listo" : "pendiente",
      mensaje:
        s.puntosVisibles === 0
          ? "No te veo: ponete a un metro y medio, de cuerpo entero."
          : "Te veo a medias: ponete de frente, con los dos hombros a la vista.",
      completo: false,
    }
  }

  return {
    camara: "listo",
    ubicacion: "listo",
    prenda: s.prendaElegida ? "listo" : "activo",
    mensaje: s.prendaElegida ? "Listo: movete y mirate." : "Elegí una prenda de la tira de abajo.",
    completo: s.prendaElegida,
  }
}
