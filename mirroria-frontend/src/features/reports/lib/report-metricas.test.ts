import { describe, expect, it } from "vitest"
import { dimensionDelReporte, metricaDelReporte, opcionesPivote } from "./report-metricas"
import { pasoConsulta, reporteDePrueba } from "./lienzo-fixtures.test-utils"
import { etiquetaFila } from "./report-etiquetas"

describe("report-metricas", () => {
  it("el híbrido toma la dimensión y métrica del paso del agente (nunca 'hibrido')", () => {
    const r = reporteDePrueba({ metrica: "simular_what_if", agruparPor: "hibrido", pasosEjecutados: [pasoConsulta({ metrica: "ventas_totales", dimension: "producto" })] })
    expect(dimensionDelReporte(r)).toBe("producto")
    expect(metricaDelReporte(r)).toBe("ingresos")
  })

  it("sin pasos ni dimensión conocida → null (se oculta 'Ver por')", () => {
    expect(dimensionDelReporte(reporteDePrueba({ agruparPor: "hibrido" }))).toBeNull()
    expect(opcionesPivote(null)).toEqual([])
  })

  it("opciones de 'Ver por' con etiquetas humanas, solo las válidas para la métrica", () => {
    const ids = opcionesPivote("ticket_promedio").map((o) => o.id)
    expect(ids).not.toContain("producto")
    expect(opcionesPivote("unidades").find((o) => o.id === "producto")?.etiqueta).toBe("Prenda")
  })

  it("etiquetas de fila legibles", () => {
    expect(etiquetaFila("2026-10-05", "dia")).toBe("5 oct")
    expect(etiquetaFila("2026-10", "mes")).toBe("Oct 2026")
    expect(etiquetaFila("NO_SHOW", "estado")).toBe("No asistió")
    expect(etiquetaFila("PAGADA", "estado")).toBe("Pagada")
    expect(etiquetaFila("VERANO25", "cupon")).toBe("VERANO25")
    expect(etiquetaFila("Vestido Floral", "producto")).toBe("Vestido Floral")
  })
})
