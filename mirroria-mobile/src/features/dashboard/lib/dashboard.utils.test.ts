import { describe, expect, it } from "vitest"
import {
  calcularVariacionPorcentual,
  formatearMontoBs,
  interpretarRotacion,
  obtenerEtiquetaPeriodo,
} from "./dashboard.utils"

describe("dashboard.utils", () => {
  describe("formatearMontoBs", () => {
    it("formatea números con decimales y símbolo Bs", () => {
      const res = formatearMontoBs(1250.5)
      expect(res).toContain("Bs")
      expect(res).toContain("1.250,50")
    })

    it("formatea cero correctamente", () => {
      const res = formatearMontoBs(0)
      expect(res).toContain("Bs")
      expect(res).toContain("0,00")
    })
  })

  describe("calcularVariacionPorcentual", () => {
    it("calcula delta positivo correctamente", () => {
      const delta = calcularVariacionPorcentual(150, 100)
      expect(delta).toBe(50)
    })

    it("calcula delta negativo correctamente", () => {
      const delta = calcularVariacionPorcentual(80, 100)
      expect(delta).toBe(-20)
    })

    it("devuelve 100% si el anterior es 0 y el actual es positivo", () => {
      const delta = calcularVariacionPorcentual(500, 0)
      expect(delta).toBe(100)
    })

    it("devuelve 0% si ambos son 0", () => {
      const delta = calcularVariacionPorcentual(0, 0)
      expect(delta).toBe(0)
    })
  })

  describe("interpretarRotacion", () => {
    it("interpreta LENTA cuando el ratio es menor a 0.3", () => {
      expect(interpretarRotacion(0.15)).toBe("LENTA")
    })

    it("interpreta SALUDABLE cuando está entre 0.3 y 2.0", () => {
      expect(interpretarRotacion(0.85)).toBe("SALUDABLE")
      expect(interpretarRotacion(1.5)).toBe("SALUDABLE")
    })

    it("interpreta ALTA cuando supera 2.0", () => {
      expect(interpretarRotacion(2.4)).toBe("ALTA")
    })
  })

  describe("obtenerEtiquetaPeriodo", () => {
    it("retorna etiquetas amigables para cada periodo", () => {
      expect(obtenerEtiquetaPeriodo("hoy")).toBe("Hoy")
      expect(obtenerEtiquetaPeriodo("7d")).toBe("Últimos 7 días")
      expect(obtenerEtiquetaPeriodo("30d")).toBe("Últimos 30 días")
      expect(obtenerEtiquetaPeriodo("mes_actual")).toBe("Mes actual")
      expect(obtenerEtiquetaPeriodo("mes_anterior")).toBe("Mes anterior")
      expect(obtenerEtiquetaPeriodo("personalizado")).toBe("Personalizado")
    })
  })
})
