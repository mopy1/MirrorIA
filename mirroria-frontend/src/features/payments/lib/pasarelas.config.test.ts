import { describe, expect, it } from "vitest"
import {
  CONFIG_PASARELAS_FRONTEND,
  estaPasarelaHabilitada,
} from "./pasarelas.config"

describe("pasarelas.config", () => {
  it("todas las pasarelas estándar inician habilitadas", () => {
    expect(estaPasarelaHabilitada("WAYRA")).toBe(true)
    expect(estaPasarelaHabilitada("STRIPE")).toBe(true)
    expect(estaPasarelaHabilitada("PAYPAL")).toBe(true)
    expect(estaPasarelaHabilitada("QR_BANCARIO")).toBe(true)
    expect(estaPasarelaHabilitada("MANUAL")).toBe(true)
  })

  it("permite deshabilitar una pasarela puntualmente sin alterar el resto", () => {
    CONFIG_PASARELAS_FRONTEND.PAYPAL.habilitada = false
    expect(estaPasarelaHabilitada("PAYPAL")).toBe(false)
    expect(estaPasarelaHabilitada("WAYRA")).toBe(true)
    // Restaurar
    CONFIG_PASARELAS_FRONTEND.PAYPAL.habilitada = true
  })

  it("retorna true para pasarelas nuevas no listadas explícitamente", () => {
    // @ts-expect-error probando pasarela no registrada
    expect(estaPasarelaHabilitada("NUEVA_PASARELA")).toBe(true)
  })
})
