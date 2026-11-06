import { describe, expect, it } from "vitest"
import { sugerenciasSeguimiento } from "./lienzo-sugerencias"
import { pasoConsulta, reporteDePrueba, TOP5 } from "./lienzo-fixtures.test-utils"

describe("sugerenciasSeguimiento", () => {
  it("unidades por prenda: ingresos, mes anterior y por sucursal", () => {
    const s = sugerenciasSeguimiento(reporteDePrueba({ filas: TOP5 }), null)
    expect(s).toEqual([
      "¿Y en ingresos, en vez de unidades?",
      "Comparar las unidades vendidas de este mes con el mes anterior",
      "Ver las unidades vendidas por sucursal",
    ])
  })

  it("usa la dimensión real del híbrido y respeta el máximo", () => {
    const r = reporteDePrueba({ metrica: "ingresos", agruparPor: "hibrido", pasosEjecutados: [pasoConsulta({ metrica: "ingresos", dimension: "sucursal" })] })
    const s = sugerenciasSeguimiento(r, "¿Querés verlo por mes?", 2)
    expect(s).toHaveLength(2)
    expect(s.join(" ")).not.toContain("por sucursal")
  })

  it("no repite la pregunta final de la IA", () => {
    const s = sugerenciasSeguimiento(reporteDePrueba({ metrica: "desconocida" }), "¿Qué prendas vendí más este mes?")
    expect(s).not.toContain("¿Qué prendas vendí más este mes?")
    expect(s.length).toBeGreaterThanOrEqual(2)
  })

  it("simulación propone otro escenario", () => {
    const s = sugerenciasSeguimiento(reporteDePrueba({ esSimulacion: true, metrica: "simular_what_if" }), null)
    expect(s[0]).toMatch(/bajo los precios/)
  })
})
