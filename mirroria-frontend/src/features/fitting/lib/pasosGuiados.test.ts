import { describe, it, expect } from "vitest"
import { calcularPasos } from "./pasosGuiados"

const senales = (p: Partial<Parameters<typeof calcularPasos>[0]> = {}) =>
  calcularPasos({ hayCamara: false, puntosVisibles: 0, prendaElegida: false, ...p })

describe("calcularPasos", () => {
  it("al entrar, el primer paso es el de la cámara y los otros esperan", () => {
    const p = senales()
    expect(p.camara).toBe("activo")
    expect(p.ubicacion).toBe("pendiente")
    expect(p.prenda).toBe("pendiente")
    expect(p.completo).toBe(false)
  })

  it("con la cámara andando, el paso activo pasa a ser ubicarse", () => {
    const p = senales({ hayCamara: true })
    expect(p.camara).toBe("listo")
    expect(p.ubicacion).toBe("activo")
  })

  it("al entrar sin cámara, el mensaje es exacto", () => {
    expect(senales().mensaje).toBe("Permití la cámara para empezar.")
  })

  it("si no se ve a nadie, el mensaje es exacto", () => {
    expect(senales({ hayCamara: true, puntosVisibles: 0 }).mensaje).toBe(
      "No te veo: ponete a un metro y medio, de cuerpo entero."
    )
  })

  it("si se ve medio cuerpo, el mensaje es exacto", () => {
    expect(senales({ hayCamara: true, puntosVisibles: 1 }).mensaje).toBe(
      "Te veo a medias: ponete de frente, con los dos hombros a la vista."
    )
  })

  it("con los dos puntos a la vista, toca elegir la prenda", () => {
    const p = senales({ hayCamara: true, puntosVisibles: 2 })
    expect(p.ubicacion).toBe("listo")
    expect(p.prenda).toBe("activo")
    expect(p.mensaje).toBe("Elegí una prenda de la tira de abajo.")
    expect(p.completo).toBe(false)
  })

  it("con los tres pasos cumplidos, el panel se da por completo", () => {
    const p = senales({ hayCamara: true, puntosVisibles: 2, prendaElegida: true })
    expect(p.mensaje).toBe("Listo: movete y mirate.")
    expect(p.completo).toBe(true)
  })

  it("si se pierde la pose, el paso 2 se vuelve a encender aunque ya haya prenda", () => {
    // Que no quede la pantalla sin prenda y sin explicacion.
    const p = senales({ hayCamara: true, puntosVisibles: 0, prendaElegida: true })
    expect(p.ubicacion).toBe("activo")
    expect(p.prenda).toBe("listo")
    expect(p.completo).toBe(false)
  })

  it("si se desconecta la cámara después de elegir prenda, se vuelve al inicio", () => {
    const p = senales({ hayCamara: false, prendaElegida: true })
    expect(p.camara).toBe("activo")
    expect(p.ubicacion).toBe("pendiente")
    expect(p.prenda).toBe("pendiente")
    expect(p.completo).toBe(false)
  })
})
