import { describe, expect, it } from "vitest"
import { describirPaso, escenarioDelReporte, plural } from "./lienzo-pasos"
import { pasoConsulta, reporteDePrueba } from "./lienzo-fixtures.test-utils"

describe("plural", () => {
  it("singular y plural correctos", () => {
    expect(plural(1, "paso")).toBe("1 paso")
    expect(plural(3, "paso")).toBe("3 pasos")
    expect(plural(2, "orden", "órdenes")).toBe("2 órdenes")
  })
})

describe("describirPaso", () => {
  it("consulta en lenguaje de gerente, con período", () => {
    const p = describirPaso(pasoConsulta({ metrica: "unidades", dimension: "producto", fechaInicio: "2026-10-01", fechaFin: "2026-10-31" }))
    expect(p.titulo).toBe("Consultó las unidades vendidas por prenda del 01/10/2026 al 31/10/2026")
    expect(p.detalle).toBe("Encontró 5 resultados")
  })

  it("un solo resultado en singular", () => {
    expect(describirPaso(pasoConsulta({ metrica: "ingresos" }, "Metrica ingresos obtenida: 1 filas.")).detalle).toBe("Encontró 1 resultado")
  })

  it("simulación sin nombrar el motor", () => {
    const p = describirPaso({ paso: 2, herramienta: "simular_what_if", argumentos: { variacionPrecioPct: 10 }, resultadoResumen: "Simulacion DuckDB: 3 escenarios proyectados." })
    expect(p.titulo).toBe("Simuló un escenario: precio +10 % y cantidad vendida sin cambios")
    expect(`${p.titulo} ${p.detalle}`).not.toMatch(/duckdb/i)
  })

  it("herramienta desconocida no muestra el nombre técnico", () => {
    const p = describirPaso({ paso: 1, herramienta: "tool_x", argumentos: {}, resultadoResumen: "" })
    expect(p.titulo).not.toContain("tool_x")
  })
})

describe("escenarioDelReporte", () => {
  it("describe las palancas o devuelve null si no hubo simulación", () => {
    expect(escenarioDelReporte(reporteDePrueba())).toBeNull()
    const r = reporteDePrueba({ pasosEjecutados: [{ paso: 1, herramienta: "simular_what_if", argumentos: { variacionPrecioPct: -5, variacionVolumenPct: 20 }, resultadoResumen: "" }] })
    expect(escenarioDelReporte(r)).toBe("Precio −5 % y cantidad vendida +20 %")
  })
})
