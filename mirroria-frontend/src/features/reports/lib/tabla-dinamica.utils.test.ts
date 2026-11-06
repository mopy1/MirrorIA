import { describe, expect, it } from "vitest"
import type { FilaReporte, Variacion } from "../types/reports.types"
import { filtrarFilas, ordenarFilas } from "./tabla-dinamica.utils"

const FILAS_PRUEBA: FilaReporte[] = [
  { clave: "c1", etiqueta: "Vestidos de Noche", valor: 5000 },
  { clave: "c2", etiqueta: "Blusas Casuales", valor: 2000 },
  { clave: "c3", etiqueta: "Pantalones Denim", valor: 3500 },
]

const VARIACIONES_PRUEBA: Variacion[] = [
  { clave: "c1", etiqueta: "Vestidos de Noche", actual: 5000, anterior: 4000, deltaAbsoluto: 1000, deltaPorcentual: 25 },
  { clave: "c2", etiqueta: "Blusas Casuales", actual: 2000, anterior: 2500, deltaAbsoluto: -500, deltaPorcentual: -20 },
  { clave: "c3", etiqueta: "Pantalones Denim", actual: 3500, anterior: 3500, deltaAbsoluto: 0, deltaPorcentual: 0 },
]

describe("tabla-dinamica.utils", () => {
  describe("filtrarFilas", () => {
    it("devuelve todas las filas si el término de búsqueda está vacío", () => {
      expect(filtrarFilas(FILAS_PRUEBA, "")).toHaveLength(3)
      expect(filtrarFilas(FILAS_PRUEBA, "   ")).toHaveLength(3)
    })

    it("filtra insensible a mayúsculas y espacios", () => {
      const res = filtrarFilas(FILAS_PRUEBA, "  VESTIDO  ")
      expect(res).toHaveLength(1)
      expect(res[0].etiqueta).toBe("Vestidos de Noche")
    })

    it("devuelve array vacío si ninguna fila coincide", () => {
      expect(filtrarFilas(FILAS_PRUEBA, "Zapatos")).toHaveLength(0)
    })
  })

  describe("ordenarFilas", () => {
    it("ordena por valor en orden descendente", () => {
      const res = ordenarFilas(FILAS_PRUEBA, "valor", "desc")
      expect(res.map((f) => f.valor)).toEqual([5000, 3500, 2000])
    })

    it("ordena por valor en orden ascendente", () => {
      const res = ordenarFilas(FILAS_PRUEBA, "valor", "asc")
      expect(res.map((f) => f.valor)).toEqual([2000, 3500, 5000])
    })

    it("ordena por etiqueta alfabética asc y desc", () => {
      const asc = ordenarFilas(FILAS_PRUEBA, "etiqueta", "asc")
      expect(asc.map((f) => f.etiqueta)).toEqual([
        "Blusas Casuales",
        "Pantalones Denim",
        "Vestidos de Noche",
      ])

      const desc = ordenarFilas(FILAS_PRUEBA, "etiqueta", "desc")
      expect(desc.map((f) => f.etiqueta)).toEqual([
        "Vestidos de Noche",
        "Pantalones Denim",
        "Blusas Casuales",
      ])
    })

    it("ordena por período anterior asc y desc", () => {
      const desc = ordenarFilas(FILAS_PRUEBA, "anterior", "desc", VARIACIONES_PRUEBA)
      expect(desc.map((f) => f.clave)).toEqual(["c1", "c3", "c2"]) // 4000, 3500, 2500

      const asc = ordenarFilas(FILAS_PRUEBA, "anterior", "asc", VARIACIONES_PRUEBA)
      expect(asc.map((f) => f.clave)).toEqual(["c2", "c3", "c1"]) // 2500, 3500, 4000
    })

    it("ordena por variación porcentual asc y desc", () => {
      const desc = ordenarFilas(FILAS_PRUEBA, "variacion", "desc", VARIACIONES_PRUEBA)
      expect(desc.map((f) => f.clave)).toEqual(["c1", "c3", "c2"]) // +25%, 0%, -20%

      const asc = ordenarFilas(FILAS_PRUEBA, "variacion", "asc", VARIACIONES_PRUEBA)
      expect(asc.map((f) => f.clave)).toEqual(["c2", "c3", "c1"]) // -20%, 0%, +25%
    })
  })
})
