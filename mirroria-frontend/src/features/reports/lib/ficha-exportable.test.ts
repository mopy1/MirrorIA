import { describe, expect, it } from "vitest"
import { fichaExportable } from "./ficha-exportable"
import { pasoConsulta, reporteDePrueba } from "./lienzo-fixtures.test-utils"

describe("fichaExportable", () => {
  it("un reporte del motor manda su ficha tal cual", () => {
    const r = reporteDePrueba({ metrica: "ingresos", agruparPor: "sucursal" })
    expect(fichaExportable(r)).toEqual(r.ficha)
  })

  it("el híbrido rearma la ficha con lo que consultó el agente (nunca 'hibrido')", () => {
    const r = reporteDePrueba({
      metrica: "unidades",
      agruparPor: "hibrido",
      pasosEjecutados: [pasoConsulta({ metrica: "unidades", dimension: "producto", fechaInicio: "2026-11-01", fechaFin: "2026-11-10", limite: 10, orden: "desc" })],
    })
    expect(fichaExportable(r)).toEqual({
      metrica: "unidades",
      agruparPor: "producto",
      filtros: { desde: "2026-11-01", hasta: "2026-11-10" },
      orden: "desc",
      limite: 10,
    })
  })

  it("traduce ventas_totales a ingresos y pasa los filtros que el agente usó", () => {
    const r = reporteDePrueba({
      metrica: "ventas_totales",
      agruparPor: "hibrido",
      pasosEjecutados: [pasoConsulta({ metrica: "ventas_totales", dimension: "sucursal", canal: "WEB", orden: "asc" })],
    })
    expect(fichaExportable(r)).toMatchObject({ metrica: "ingresos", agruparPor: "sucursal", filtros: { canal: "WEB" }, orden: "asc" })
  })

  it("una simulación o un reporte sin consulta de métricas no se puede exportar", () => {
    const sim = reporteDePrueba({ metrica: "simular_what_if", agruparPor: "hibrido", esSimulacion: true, pasosEjecutados: [pasoConsulta({ metrica: "ingresos", dimension: "mes" })] })
    expect(fichaExportable(sim)).toBeNull()
    expect(fichaExportable(reporteDePrueba({ metrica: "stock_proveedores", agruparPor: "hibrido" }))).toBeNull()
  })
})
