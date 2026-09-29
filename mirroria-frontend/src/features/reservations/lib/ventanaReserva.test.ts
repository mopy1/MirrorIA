import { describe, expect, it } from "vitest"
import { aDatetimeLocal, estaEnVentana, ventanaReserva } from "./ventanaReserva"

describe("aDatetimeLocal", () => {
  it("formatea en hora local con ceros a la izquierda", () => {
    expect(aDatetimeLocal(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03")
  })
})

describe("ventanaReserva", () => {
  it("sin cupo usa 30 min / 48 h por defecto", () => {
    const ahora = new Date(2026, 8, 29, 10, 0, 0, 0)
    expect(ventanaReserva(ahora)).toEqual({ min: "2026-09-29T10:30", max: "2026-10-01T10:00" })
  })

  it("respeta las reglas que manda el cupo", () => {
    const ahora = new Date(2026, 8, 29, 23, 50, 0, 0)
    const ventana = ventanaReserva(ahora, { anticipacionMinimaMinutos: 60, ventanaMaximaHoras: 24 })
    expect(ventana).toEqual({ min: "2026-09-30T00:50", max: "2026-09-30T23:50" })
  })

  it("redondea el mínimo al minuto siguiente si hay segundos", () => {
    const ahora = new Date(2026, 8, 29, 10, 0, 15, 0)
    expect(ventanaReserva(ahora).min).toBe("2026-09-29T10:31")
  })
})

describe("estaEnVentana", () => {
  const ventana = { min: "2026-09-29T10:30", max: "2026-10-01T10:00" }
  it("acepta los extremos y rechaza lo que queda afuera", () => {
    expect(estaEnVentana("2026-09-29T10:30", ventana)).toBe(true)
    expect(estaEnVentana("2026-10-01T10:00", ventana)).toBe(true)
    expect(estaEnVentana("2026-09-29T10:29", ventana)).toBe(false)
    expect(estaEnVentana("2026-10-01T10:01", ventana)).toBe(false)
  })
})
