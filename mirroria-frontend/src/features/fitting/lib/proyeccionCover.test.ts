import { describe, it, expect } from "vitest"
import { proyeccionCover } from "./proyeccionCover"

describe("proyeccionCover", () => {
  it("un video 4:3 en un recuadro 3:4 sobra ancho: offsetX negativo, offsetY cero", () => {
    // El caso real: cámara 640x480 dentro de la escena vertical (~1236x1648).
    const p = proyeccionCover(640, 480, 1236, 1648)
    expect(p.escala).toBeCloseTo(1648 / 480) // 3.4333...
    expect(p.anchoMostrado).toBeCloseTo(640 * (1648 / 480)) // ≈2197.33
    expect(p.altoMostrado).toBeCloseTo(1648)
    expect(p.offsetX).toBeLessThan(0)
    expect(p.offsetY).toBeCloseTo(0)
  })

  it("un video 16:9 en el mismo tipo de recuadro también sobra ancho", () => {
    const p = proyeccionCover(1920, 1080, 300, 400)
    expect(p.escala).toBeCloseTo(400 / 1080)
    expect(p.anchoMostrado).toBeCloseTo(1920 * (400 / 1080))
    expect(p.altoMostrado).toBeCloseTo(400)
    expect(p.offsetX).toBeLessThan(0)
    expect(p.offsetY).toBeCloseTo(0)
  })

  it("cuando las proporciones coinciden no hay recorte: offsets en cero", () => {
    const p = proyeccionCover(900, 1200, 300, 400)
    expect(p.escala).toBeCloseTo(1 / 3)
    expect(p.anchoMostrado).toBeCloseTo(300)
    expect(p.altoMostrado).toBeCloseTo(400)
    expect(p.offsetX).toBeCloseTo(0)
    expect(p.offsetY).toBeCloseTo(0)
  })

  it("caso real con números concretos: un hombro en x=0.76 cae en ≈1189px, no en 940px", () => {
    // 940 = 0.76 × 1236 es lo que daba el cálculo viejo, usando el ancho del
    // recuadro visible en vez del ancho realmente mostrado por `object-cover`.
    const p = proyeccionCover(640, 480, 1236, 1648)
    const xFraccion = 0.76
    const posicionEnPantalla = xFraccion * p.anchoMostrado + p.offsetX
    expect(posicionEnPantalla).toBeCloseTo(1189, 0)
    expect(posicionEnPantalla).not.toBeCloseTo(940, 0)
  })
})
