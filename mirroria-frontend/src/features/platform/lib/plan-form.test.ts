import { describe, expect, it } from "vitest"
import { dtoDesdeForm, errorPlanForm, formDesdePlan } from "./plan-form"

describe("plan-form", () => {
  it("convierte a centavos y deja null los límites vacíos (ilimitado)", () => {
    const f = { ...formDesdePlan(null), codigo: "pro", nombre: "Pro", precioBs: "99.5", precioUsd: "14.9", maxSucursales: "2" }
    expect(errorPlanForm(f, true)).toBeNull()
    expect(dtoDesdeForm(f)).toMatchObject({ precioMensualCents: 9950, precioMensualUsdCents: 1490, limites: { maxSucursales: 2, maxProductos: null } })
  })
  it("valida código y días de prueba", () => {
    expect(errorPlanForm({ ...formDesdePlan(null), codigo: "X" }, true)).toMatch(/Código/)
    expect(errorPlanForm({ ...formDesdePlan(null), codigo: "pro", nombre: "Pro", precioBs: "1", precioUsd: "1", diasPrueba: "90" }, true)).toMatch(/Días/)
  })
  it("manda nivel de marca y destacado (Fase 1b)", () => {
    const f = { ...formDesdePlan(null), codigo: "pro", nombre: "Pro", precioBs: "1", precioUsd: "1", nivelMarca: "COMPLETA" as const, destacado: true }
    expect(dtoDesdeForm(f)).toMatchObject({ nivelMarca: "COMPLETA", destacado: true })
    expect(formDesdePlan(null).nivelMarca).toBe("ESENCIAL")
  })
})
