import { describe, expect, it } from "vitest"
import { haceCuanto, mesAnterior, mesCorto, porcentaje, variacion } from "./indicadores"

describe("indicadores de la plataforma", () => {
  it("variación con signo y texto", () => {
    expect(variacion(7, 4, "octubre")).toEqual({ tendencia: "sube", texto: "+3 vs octubre" })
    expect(variacion(2, 5, "octubre")).toEqual({ tendencia: "baja", texto: "−3 vs octubre" })
    expect(variacion(3, 3, "octubre").tendencia).toBe("igual")
  })

  it("meses y porcentajes", () => {
    expect(mesCorto("2026-10")).toBe("oct")
    expect(mesAnterior(new Date(2026, 0, 15))).toBe("diciembre")
    expect(porcentaje(0.125)).toBe("12,5 %")
    expect(porcentaje(0)).toBe("0 %")
  })

  it("hace cuánto", () => {
    const ahora = new Date("2026-11-05T12:00:00Z").getTime()
    expect(haceCuanto("2026-11-05T11:59:40Z", ahora)).toBe("recién")
    expect(haceCuanto("2026-11-05T10:00:00Z", ahora)).toBe("hace 2 h")
    expect(haceCuanto("2026-11-04T10:00:00Z", ahora)).toBe("ayer")
    expect(haceCuanto("2026-11-01T10:00:00Z", ahora)).toBe("hace 4 días")
  })
})
