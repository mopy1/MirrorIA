import { describe, expect, it } from "vitest"
import { calcularCifras, fraseComparacion } from "./lienzo-cifras"
import { pasoConsulta, reporteDePrueba, TOP5 } from "./lienzo-fixtures.test-utils"

const valores = (r: ReturnType<typeof calcularCifras>) => Object.fromEntries(r.map((c) => [c.id, c]))

describe("calcularCifras", () => {
  it("sin filas no hay cifras", () => {
    expect(calcularCifras(reporteDePrueba())).toEqual([])
  })

  it("ranking: total, líder con participación, cantidad y promedio", () => {
    const c = valores(calcularCifras(reporteDePrueba({ filas: TOP5 })))
    expect(c.total.etiqueta).toBe("Total de unidades vendidas")
    expect(c.total.valor).toBe("33")
    expect(c.lider.valor).toBe("Vestido Floral Primavera")
    expect(c.lider.detalle).toBe("10 · 30,3 % del total")
    expect(c.cantidad.valor).toBe("5 prendas")
    expect(c.promedio.etiqueta).toBe("Promedio por prenda")
    expect(c.promedio.valor).toBe("6,6")
  })

  it("dinero en Bs (centavos) y la dimensión real del reporte híbrido", () => {
    const r = reporteDePrueba({
      metrica: "ingresos",
      agruparPor: "hibrido",
      pasosEjecutados: [pasoConsulta({ metrica: "ingresos", dimension: "sucursal" })],
      filas: [
        { clave: "a", etiqueta: "Centro", valor: 300000 },
        { clave: "b", etiqueta: "Norte", valor: 100000 },
      ],
    })
    const c = valores(calcularCifras(r))
    expect(c.total.valor).toMatch(/4\.000,00/)
    expect(c.cantidad.valor).toBe("2 sucursales")
    expect(c.lider.detalle).toContain("75 % del total")
  })

  it("métrica no sumable (promedio): sin total ni participación", () => {
    const r = reporteDePrueba({ metrica: "ticket_promedio", agruparPor: "sucursal", filas: [
      { clave: "a", etiqueta: "Centro", valor: 20000 },
      { clave: "b", etiqueta: "Norte", valor: 10000 },
    ] })
    const c = valores(calcularCifras(r))
    expect(c.total).toBeUndefined()
    expect(c.lider.detalle).not.toContain("del total")
  })

  it("serie temporal: 'El mejor día' con la fecha en humano", () => {
    const r = reporteDePrueba({ metrica: "unidades", agruparPor: "dia", filas: [
      { clave: "a", etiqueta: "2026-10-05", valor: 3 },
      { clave: "b", etiqueta: "2026-10-06", valor: 9 },
    ] })
    const c = valores(calcularCifras(r))
    expect(c.lider.etiqueta).toBe("El mejor día")
    expect(c.lider.valor).toBe("6 oct")
  })

  it("una sola fila: una cifra con el nombre de la métrica", () => {
    const r = reporteDePrueba({ metrica: "cantidad_ventas", agruparPor: "ninguno", filas: [{ clave: "t", etiqueta: "Total", valor: 42 }] })
    expect(calcularCifras(r)).toEqual([{ id: "total", etiqueta: "Cantidad de ventas", valor: "42" }])
  })

  it("simulación: hoy vs. escenario, nunca nombra el motor", () => {
    const r = reporteDePrueba({
      metrica: "simular_what_if",
      esSimulacion: true,
      pasosEjecutados: [pasoConsulta({ metrica: "unidades" })],
      filas: [{ clave: "0", etiqueta: "Vestido", valor: 11, detalles: { original: 10 } }],
    })
    const c = calcularCifras(r)
    expect(c.map((x) => x.etiqueta)).toEqual(["Hoy, con datos reales", "Con el escenario simulado"])
    expect(c[1].detalle).toBe("+10 % vs. hoy (10)")
    expect(c[1].tendencia).toBe("sube")
    expect(JSON.stringify(c)).not.toMatch(/duckdb/i)
  })

  it("comparación de períodos en el total", () => {
    const r = reporteDePrueba({
      filas: TOP5.slice(0, 2),
      comparacion: {
        rango: { desde: "2026-09-01", hasta: "2026-09-30" },
        filas: [],
        variaciones: [
          { clave: "0", etiqueta: "", actual: 10, anterior: 6, deltaAbsoluto: 4, deltaPorcentual: 66.7 },
          { clave: "1", etiqueta: "", actual: 8, anterior: 6, deltaAbsoluto: 2, deltaPorcentual: 33.3 },
        ],
      },
    })
    const total = calcularCifras(r).find((x) => x.id === "total")
    expect(total?.detalle).toBe("+50 % vs. el período anterior (12)")
  })
})

describe("fraseComparacion", () => {
  it("no inventa porcentajes cuando antes fue 0", () => {
    expect(fraseComparacion(5, 0, "unidades")).toBe("Sin datos en el período anterior")
    expect(fraseComparacion(0, 0, "unidades")).toBe("Igual que el período anterior")
    expect(fraseComparacion(5, 10, "unidades")).toBe("−50 % vs. el período anterior (10)")
  })
})
