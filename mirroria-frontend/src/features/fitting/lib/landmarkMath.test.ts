import { describe, it, expect } from "vitest"
import { ANCLA_ESTANDAR, calcularTransformPrenda, VISIBILIDAD_MINIMA } from "./landmarkMath"

const visible = (x: number, y: number) => ({ x, y, visibility: 0.9 })

describe("calcularTransformPrenda", () => {
  it("con los hombros nivelados y espejado, la prenda no se inclina", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), visible(0.4, 0.4), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(true)
    expect(Math.abs(t.rotationDeg)).toBeLessThan(0.001)
  })

  it("el ancho de la prenda sale del ancho entre los dos puntos", () => {
    // 0,2 del ancho del contenedor = 200 px entre puntos; la convención dice
    // que esos 200 px son el 65 % del ancho de la imagen.
    const t = calcularTransformPrenda(
      visible(0.6, 0.5), visible(0.4, 0.5), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.width).toBeCloseTo(200 / 0.65, 5)
    expect(t.height).toBeCloseTo((200 / 0.65) * (600 / 400), 5)
  })

  it("el punto medio entre los dos puntos queda donde dice el ancla", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.5), visible(0.4, 0.5), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.left + ANCLA_ESTANDAR.anchorX * t.width).toBeCloseTo(500, 5)
    expect(t.top + ANCLA_ESTANDAR.anchorY * t.height).toBeCloseTo(400, 5)
  })

  it("si falta uno de los dos puntos, la prenda se oculta", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), undefined, 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(false)
  })

  it("si un punto está por debajo del umbral de visibilidad, la prenda se oculta", () => {
    // Review Focus 2: con un hombro tapado no se ancla a uno solo ni salta.
    const flojo = { x: 0.4, y: 0.4, visibility: VISIBILIDAD_MINIMA - 0.01 }
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), flojo, 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(false)
  })

  it("sin espejar, unos hombros nivelados tampoco se inclinan", () => {
    // OJO con el orden: el detector entrega coordenadas CRUDAS del sensor, y de
    // frente a la cámara el hombro DERECHO anatómico siempre tiene menor x que
    // el izquierdo, se espeje o no. Pasarlos en "orden de pantalla" da 180 y
    // tienta a meterle un swap a la función, que rompe el caso real.
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), visible(0.4, 0.4), 1000, 800, false, 400, 600, ANCLA_ESTANDAR
    )
    expect(Math.abs(t.rotationDeg)).toBeLessThan(0.001)
  })
})
