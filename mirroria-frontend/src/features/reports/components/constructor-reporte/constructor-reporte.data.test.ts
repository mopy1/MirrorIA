import { describe, expect, it } from "vitest"
import {
  calcularPeriodoAnterior,
  DIMENSIONES_DISPONIBLES,
  METRICAS_DISPONIBLES,
  RANGOS_PRESET,
  resolverRango,
} from "./constructor-reporte.data"

describe("constructor-reporte.data", () => {
  it("contiene las métricas, dimensiones y rangos analíticos de la Fase 4", () => {
    const dimIds = DIMENSIONES_DISPONIBLES.map((d) => d.id)
    expect(dimIds).toContain("metodo_pago")
    expect(dimIds).toContain("proveedor_pago")
    expect(dimIds).toContain("proveedor")
    expect(dimIds).toContain("sucursal")

    const metricasIds = METRICAS_DISPONIBLES.map((m) => m.id)
    expect(metricasIds).toContain("ingresos")
    expect(metricasIds).toContain("unidades")
    expect(metricasIds).toContain("cantidad_ventas")
    expect(metricasIds).toContain("ticket_promedio")

    const rangoIds = RANGOS_PRESET.map((r) => r.id)
    expect(rangoIds).toContain("hoy")
    expect(rangoIds).toContain("este_mes")
  })

  it("resolverRango para 'hoy' devuelve fechas iguales", () => {
    const r = resolverRango("hoy")
    const hoy = new Date().toISOString().slice(0, 10)
    expect(r.desde).toBe(hoy)
    expect(r.hasta).toBe(hoy)
  })

  it("resolverRango para 'ultimos_7' devuelve un rango de 7 días", () => {
    const r = resolverRango("ultimos_7")
    expect(r.desde).toBeDefined()
    expect(r.hasta).toBeDefined()
    const diffDays = Math.round(
      (new Date(r.hasta!).getTime() - new Date(r.desde!).getTime()) / 86400000
    )
    expect(diffDays).toBe(7)
  })

  it("resolverRango para 'este_mes' inicia en el día 01 del mes actual", () => {
    const r = resolverRango("este_mes")
    expect(r.desde).toMatch(/^\d{4}-\d{2}-01$/)
    expect(r.hasta).toBe(new Date().toISOString().slice(0, 10))
  })

  it("resolverRango para 'mes_anterior' cubre el mes previo completo", () => {
    const r = resolverRango("mes_anterior")
    expect(r.desde).toMatch(/^\d{4}-\d{2}-01$/)
    expect(r.hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("resolverRango para 'historico' devuelve undefined", () => {
    const r = resolverRango("historico")
    expect(r.desde).toBeUndefined()
    expect(r.hasta).toBeUndefined()
  })

  it("calcularPeriodoAnterior calcula un período simétrico previo", () => {
    const ant = calcularPeriodoAnterior("2026-11-01", "2026-11-10")
    expect(ant).toBeDefined()
    expect(ant?.hasta).toBe("2026-10-31")
    expect(ant?.desde).toBe("2026-10-22")
  })

  it("calcularPeriodoAnterior devuelve undefined si faltan fechas", () => {
    expect(calcularPeriodoAnterior(undefined, "2026-11-10")).toBeUndefined()
    expect(calcularPeriodoAnterior("2026-11-01", undefined)).toBeUndefined()
  })
})
