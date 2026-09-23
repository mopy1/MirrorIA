import { describe, it, expect } from "vitest"
import {
  ESTABILIDAD_INICIAL,
  MS_PARA_ESTABILIZARSE,
  MS_PARA_PERDERSE,
  siguienteEstabilidad,
} from "./estabilidadDePose"

/** Corre una tira de cuadros: `[msDesdeElPrimero, veLosDosPuntos]`. */
const correr = (cuadros: [number, boolean][], desde = ESTABILIDAD_INICIAL) =>
  cuadros.reduce((estado, [ms, ve]) => siguienteEstabilidad(estado, ve, ms), desde)

describe("siguienteEstabilidad", () => {
  it("al entrar, la pose no se da por estable", () => {
    expect(ESTABILIDAD_INICIAL.estable).toBe(false)
  })

  it("ver los dos puntos un instante no alcanza", () => {
    const e = correr([
      [0, true],
      [100, true],
      [900, true],
    ])
    expect(e.estable).toBe(false)
  })

  it("verlos un segundo seguido sí la vuelve estable", () => {
    const e = correr([
      [0, true],
      [500, true],
      [MS_PARA_ESTABILIZARSE, true],
    ])
    expect(e.estable).toBe(true)
  })

  it("el segundo se cuenta desde el primer cuadro bueno, no desde el último", () => {
    // Si se reiniciara en cada cuadro nunca llegaría a estable: a 30 fps
    // ningún par de cuadros consecutivos está a un segundo de distancia.
    const cuadros: [number, boolean][] = []
    for (let ms = 0; ms < MS_PARA_ESTABILIZARSE; ms += 33) cuadros.push([ms, true])
    // El último cuadro de la tira cae a 990 ms: todavía no.
    expect(correr(cuadros).estable).toBe(false)
    expect(correr([...cuadros, [MS_PARA_ESTABILIZARSE + 23, true]]).estable).toBe(true)
  })

  it("un cuadro perdido en el medio reinicia la espera", () => {
    const e = correr([
      [0, true],
      [900, true],
      [930, false],
      [960, true],
      [1500, true],
    ])
    expect(e.estable).toBe(false)
  })

  it("ya estable, un parpadeo corto NO apaga la pose", () => {
    // El caso que hacía parpadear la prenda a 30 fps: la visibilidad oscila
    // alrededor del umbral con luz mala o ropa oscura.
    const estable = correr([
      [0, true],
      [MS_PARA_ESTABILIZARSE, true],
    ])
    expect(estable.estable).toBe(true)
    const despues = correr(
      [
        [1100, false],
        [1133, true],
        [1166, false],
        [1200, true],
      ],
      estable,
    )
    expect(despues.estable).toBe(true)
  })

  it("perder la pose de verdad sí la apaga", () => {
    const estable = correr([
      [0, true],
      [MS_PARA_ESTABILIZARSE, true],
    ])
    const despues = correr(
      [
        [1100, false],
        [1100 + MS_PARA_PERDERSE, false],
      ],
      estable,
    )
    expect(despues.estable).toBe(false)
  })

  it("recuperar la pose dentro de la tolerancia borra el candidato a perderla", () => {
    const estable = { estable: true, candidatoDesde: 1000 }
    const e = siguienteEstabilidad(estable, true, 1200)
    expect(e.estable).toBe(true)
    expect(e.candidatoDesde).toBeNull()
  })

  it("devuelve el mismo objeto cuando no hay nada que cambiar", () => {
    // A ~30 cuadros por segundo, un objeto nuevo por cuadro sería un render
    // de más por cuadro.
    const estable = { estable: true, candidatoDesde: null }
    expect(siguienteEstabilidad(estable, true, 5000)).toBe(estable)
    expect(siguienteEstabilidad(ESTABILIDAD_INICIAL, false, 5000)).toBe(ESTABILIDAD_INICIAL)
  })

  it("con las esperas en cero se comporta como el cuadro actual, sin histéresis", () => {
    expect(siguienteEstabilidad(ESTABILIDAD_INICIAL, true, 0, 0, 0).estable).toBe(true)
    const estable = { estable: true, candidatoDesde: null }
    expect(siguienteEstabilidad(estable, false, 0, 0, 0).estable).toBe(false)
  })

  it("un reloj que va para atrás no la vuelve estable de golpe", () => {
    const e = siguienteEstabilidad({ estable: false, candidatoDesde: 5000 }, true, 4000)
    expect(e.estable).toBe(false)
    expect(e.candidatoDesde).toBe(5000)
  })
})
