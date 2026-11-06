import { describe, expect, it } from "vitest"
import {
  calcularReabastecimientoSugerido,
  clasificarRiesgoNoShow,
  clasificarRiesgoQuiebre,
  obtenerInfoClusterRfm,
} from "./ml.utils"

describe("ml.utils", () => {
  describe("calcularReabastecimientoSugerido", () => {
    it("aplica buffer del 20% y resta el stock actual", () => {
      // demanda=10, 20% buffer = 12, stock=4 -> reposicion=8
      expect(calcularReabastecimientoSugerido(10, 4, 20)).toBe(8)
    })

    it("retorna 0 si el stock actual cubre holgadamente la demanda proyectada", () => {
      // demanda=10, 20% buffer = 12, stock=20 -> 0
      expect(calcularReabastecimientoSugerido(10, 20)).toBe(0)
    })

    it("retorna 0 si la demanda proyectada es 0 o negativa", () => {
      expect(calcularReabastecimientoSugerido(0, 5)).toBe(0)
      expect(calcularReabastecimientoSugerido(-3, 5)).toBe(0)
    })
  })

  describe("clasificarRiesgoQuiebre", () => {
    it("clasifica correctamente según días de stock", () => {
      expect(clasificarRiesgoQuiebre(2)).toBe("CRITICO")
      expect(clasificarRiesgoQuiebre(5)).toBe("ALTO")
      expect(clasificarRiesgoQuiebre(12)).toBe("MEDIO")
      expect(clasificarRiesgoQuiebre(25)).toBe("BAJO")
    })
  })

  describe("clasificarRiesgoNoShow", () => {
    it("identifica riesgo bajo (< 30%)", () => {
      const res = clasificarRiesgoNoShow(0.15)
      expect(res.nivel).toBe("BAJO")
      expect(res.color).toBe("VERDE")
    })

    it("identifica riesgo moderado (30% - 60%)", () => {
      const res = clasificarRiesgoNoShow(0.45)
      expect(res.nivel).toBe("MODERADO")
      expect(res.color).toBe("AMARILLO")
    })

    it("identifica alto riesgo (> 60%) con alerta de WhatsApp", () => {
      const res = clasificarRiesgoNoShow(0.75)
      expect(res.nivel).toBe("ALTO")
      expect(res.color).toBe("ROJO")
      expect(res.accion).toContain("WhatsApp")
    })

    it("soporta valores porcentuales en escala 0-100", () => {
      expect(clasificarRiesgoNoShow(75).nivel).toBe("ALTO")
      expect(clasificarRiesgoNoShow(25).nivel).toBe("BAJO")
    })
  })

  describe("obtenerInfoClusterRfm", () => {
    it("retorna metadatos válidos para cada clúster", () => {
      expect(obtenerInfoClusterRfm("VIPS_LEALES").nombre).toBe("VIPs / Leales")
      expect(obtenerInfoClusterRfm("POTENCIALES_NUEVAS").nombre).toBe("Nuevas Promesas")
      expect(obtenerInfoClusterRfm("EN_RIESGO_DORMIDAS").nombre).toBe("En Riesgo / Dormidas")
      expect(obtenerInfoClusterRfm("OCASIONALES_OUTLET").nombre).toBe("Ocasionales / Outlet")
    })
  })
})
