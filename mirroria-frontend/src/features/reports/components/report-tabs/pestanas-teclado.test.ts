import { describe, expect, it } from "vitest"
import { indiceSegunTecla } from "./pestanas-teclado"

describe("indiceSegunTecla", () => {
  it("las flechas dan la vuelta", () => {
    expect(indiceSegunTecla(2, 3, "ArrowRight")).toBe(0)
    expect(indiceSegunTecla(0, 3, "ArrowLeft")).toBe(2)
  })

  it("Inicio y Fin van a los extremos; otras teclas no hacen nada", () => {
    expect(indiceSegunTecla(1, 4, "Home")).toBe(0)
    expect(indiceSegunTecla(1, 4, "End")).toBe(3)
    expect(indiceSegunTecla(1, 4, "a")).toBeNull()
  })
})
