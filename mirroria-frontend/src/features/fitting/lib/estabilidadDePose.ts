/**
 * Estado de la histéresis del paso 2 («Ubicate de frente»).
 *
 * `candidatoDesde` es el instante en que el cuadro empezó a decir lo
 * contrario de lo que dice `estable`. Mientras ese candidato no cumple su
 * espera, no pasa nada: es lo que evita el parpadeo.
 */
export interface EstabilidadPose {
  estable: boolean
  candidatoDesde: number | null
}

export const ESTABILIDAD_INICIAL: EstabilidadPose = { estable: false, candidatoDesde: null }

/** El segundo que promete el diseño: «se marca cuando el detector ve los dos
 * hombros por encima del umbral durante un segundo seguido». */
export const MS_PARA_ESTABILIZARSE = 1000

/** Cuánto se tolera perder la pose antes de dar por perdida la ubicación. Más
 * corto que el segundo de entrada a propósito: entrar tiene que costar
 * (no queremos anclar la prenda a una detección dudosa), pero salir tiene que
 * ser rápido cuando la clienta se va de verdad del cuadro. */
export const MS_PARA_PERDERSE = 600

/**
 * Decide si la pose se considera estable, a partir del estado anterior, de lo
 * que dice el cuadro actual y de cuánto tiempo pasó.
 *
 * Por qué existe: el detector devuelve la visibilidad de cada punto cuadro a
 * cuadro, y con luz mala, media vuelta o ropa oscura esa visibilidad oscila
 * alrededor del umbral. Mirando solo el cuadro actual, el paso 2 del panel
 * —y la prenda— parpadeaban a 30 fps. Es lo primero que ve una persona real
 * con un teléfono en la mano.
 *
 * Devuelve el MISMO objeto cuando no hay nada que cambiar: así el estado de
 * React no cambia de identidad en cada uno de los ~30 cuadros por segundo y
 * no dispara un render de más.
 */
export function siguienteEstabilidad(
  previo: EstabilidadPose,
  veLosDosPuntos: boolean,
  ahora: number,
  msParaEstabilizarse: number = MS_PARA_ESTABILIZARSE,
  msParaPerderse: number = MS_PARA_PERDERSE,
): EstabilidadPose {
  // El cuadro dice lo mismo que el estado: no hay candidato a cambio.
  if (veLosDosPuntos === previo.estable) {
    return previo.candidatoDesde === null
      ? previo
      : { estable: previo.estable, candidatoDesde: null }
  }

  const desde = previo.candidatoDesde ?? ahora
  const espera = veLosDosPuntos ? msParaEstabilizarse : msParaPerderse
  // `>=` y no `>`: con la espera en 0 el cambio es inmediato, que es lo que
  // uno espera al desactivar la histéresis en una prueba.
  if (ahora - desde >= espera) return { estable: veLosDosPuntos, candidatoDesde: null }
  return { estable: previo.estable, candidatoDesde: desde }
}
