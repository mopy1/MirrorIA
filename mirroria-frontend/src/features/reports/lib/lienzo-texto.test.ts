import { describe, expect, it } from "vitest"
import { cuandoSeGenero, metadatosReporte, textoParaCopiar } from "./lienzo-texto"

const AHORA = new Date(2026, 10, 6, 11, 0)

describe("lienzo-texto", () => {
  it("cuándo se generó: hoy, ayer o fecha", () => {
    expect(cuandoSeGenero(new Date(2026, 10, 6, 10, 5), AHORA)).toBe("hoy 10:05")
    expect(cuandoSeGenero(new Date(2026, 10, 5, 18, 30), AHORA)).toBe("ayer 18:30")
    expect(cuandoSeGenero(new Date(2026, 10, 1, 9, 0), AHORA)).toBe("01/11 09:00")
  })

  it("metadatos en una línea", () => {
    expect(metadatosReporte({ generadoEn: new Date(2026, 10, 6, 10, 50), conIa: true, ahora: AHORA })).toBe(
      "Generado hoy 10:50 · análisis de la IA con datos reales de tu tienda",
    )
    expect(metadatosReporte({ conIa: false })).toBe("Datos reales de tu tienda")
    expect(metadatosReporte({ esSimulacion: true, conIa: true })).toBe("Escenario simulado sobre tus datos reales")
  })

  it("texto para copiar con conclusión y cifras", () => {
    const t = textoParaCopiar("Top 5", "Lideran los vestidos.", [{ id: "t", etiqueta: "Total", valor: "33", detalle: "+10 %" }])
    expect(t).toBe("Top 5\n\nLideran los vestidos.\n\n- Total: 33 (+10 %)")
  })
})
