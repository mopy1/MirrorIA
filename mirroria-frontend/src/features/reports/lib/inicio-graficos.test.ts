import { describe, expect, it } from "vitest"
import type { Reporte } from "../types/reports.types"
import { estadoGrafico } from "./inicio-graficos"

function rep(valores: number[]): Reporte {
  return {
    ficha: { metrica: "ingresos", agruparPor: "sucursal", filtros: {}, orden: "desc", limite: 20 },
    filas: valores.map((valor, i) => ({ clave: String(i), etiqueta: `Sucursal ${i + 1}`, valor })),
    comparacion: null,
    narrativa: null,
  }
}

describe("estadoGrafico", () => {
  it("sin filas (o todas en 0) es vacío", () => {
    expect(estadoGrafico(rep([]))).toEqual({ tipo: "vacio" })
    expect(estadoGrafico(rep([0, 0]))).toEqual({ tipo: "vacio" })
  })

  it("una sola sucursal con ventas (el caso de Tiendaria) es 'unico', no un gráfico vacío", () => {
    expect(estadoGrafico(rep([712000]))).toEqual({ tipo: "unico", etiqueta: "Sucursal 1", valor: 712000 })
    expect(estadoGrafico(rep([712000, 0]))).toEqual({ tipo: "unico", etiqueta: "Sucursal 1", valor: 712000 })
  })

  it("dos o más filas con valor se grafican", () => {
    expect(estadoGrafico(rep([5, 3]))).toEqual({ tipo: "grafico" })
  })
})
