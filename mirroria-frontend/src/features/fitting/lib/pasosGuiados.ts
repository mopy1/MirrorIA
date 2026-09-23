export interface SenalesProbador {
  hayCamara: boolean
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
 * prenda cuando hay una elegida. Si la pose se pierde, el paso 2 se reenciende
 * aunque ya hubiera prenda: así la pantalla nunca queda sin prenda y sin
 * explicación.
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
