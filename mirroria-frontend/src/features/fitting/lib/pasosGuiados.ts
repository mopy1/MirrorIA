export interface SenalesProbador {
  hayCamara: boolean
  /** ¿La sesión realtime con la IA (Decart VTON) ya está conectada? */
  iaConectada: boolean
  /** ¿Se está intentando conectar en este momento? Distingue "todavía no
   * conectó" de "falló al conectar" para el mensaje del panel. */
  iaConectando: boolean
  prendaElegida: boolean
}

export type EstadoPaso = "pendiente" | "activo" | "listo"

export interface PasosProbador {
  camara: EstadoPaso
  ia: EstadoPaso
  prenda: EstadoPaso
  mensaje: string
  completo: boolean
}

/**
 * Traduce señales reales del sistema a los tres pasos del panel guiado.
 *
 * Ningún paso se marca porque la clienta lo diga: la cámara se marca cuando
 * llega el stream, la IA cuando la sesión realtime con Decart conecta, y la
 * prenda cuando hay una elegida. Ya no hace falta pedirle a la clienta que
 * se ubique de una forma particular (eso lo resuelve el modelo del lado del
 * servidor) — el paso 2 es puramente "conectando/conectado", no una
 * instrucción de postura.
 */
export function calcularPasos(s: SenalesProbador): PasosProbador {
  if (!s.hayCamara) {
    return {
      camara: "activo",
      ia: "pendiente",
      prenda: "pendiente",
      mensaje: "Permití la cámara para empezar.",
      completo: false,
    }
  }

  if (!s.iaConectada) {
    return {
      camara: "listo",
      ia: "activo",
      prenda: s.prendaElegida ? "listo" : "pendiente",
      mensaje: s.iaConectando ? "Conectando con la IA…" : "No se pudo conectar con la IA. Reintentá.",
      completo: false,
    }
  }

  return {
    camara: "listo",
    ia: "listo",
    prenda: s.prendaElegida ? "listo" : "activo",
    mensaje: s.prendaElegida ? "Listo: movete y mirate." : "Elegí una prenda de la tira de abajo.",
    completo: s.prendaElegida,
  }
}
