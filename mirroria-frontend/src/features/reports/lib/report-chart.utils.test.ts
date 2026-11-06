import { describe, expect, it } from "vitest"
import { datosGrafico, elegirFormaGrafico, tituloGrafico } from "./report-chart.utils"
import { pasoConsulta, reporteDePrueba, TOP5 } from "./lienzo-fixtures.test-utils"

describe("elegirFormaGrafico", () => {
  it("ranking → barras horizontales; sin filas → nada", () => {
    expect(elegirFormaGrafico(reporteDePrueba({ filas: TOP5 }))).toBe("barras")
    expect(elegirFormaGrafico(reporteDePrueba())).toBeNull()
  })

  it("serie de tiempo (también en el híbrido) → línea", () => {
    const r = reporteDePrueba({ agruparPor: "hibrido", pasosEjecutados: [pasoConsulta({ metrica: "ingresos", dimension: "dia" })], filas: TOP5 })
    expect(elegirFormaGrafico(r)).toBe("linea")
  })

  it("simulación → comparación hoy vs. simulado con la referencia real", () => {
    const r = reporteDePrueba({ esSimulacion: true, filas: [{ clave: "0", etiqueta: "A", valor: 12, detalles: { original: 10 } }] })
    expect(elegirFormaGrafico(r)).toBe("simulacion")
    expect(datosGrafico(r)[0]).toMatchObject({ valor: 12, referencia: 10 })
    expect(tituloGrafico(r)).toBe("Hoy comparado con el escenario simulado")
  })

  it("título humano del gráfico", () => {
    expect(tituloGrafico(reporteDePrueba({ filas: TOP5 }))).toBe("Unidades vendidas por prenda")
  })
})
