import { describe, expect, it } from "vitest"
import { planACobrar, rutaDePago } from "./plan-a-cobrar"

const BASICO = { codigo: "basico", nombre: "Básico" }
const CADENA = { codigo: "cadena", nombre: "Cadena" }

describe("plan a cobrar", () => {
  it("sin plan en la URL cobra el plan actual", () => {
    expect(planACobrar([BASICO, CADENA], null, BASICO)).toBe(BASICO)
  })

  it("con plan en la URL cobra ese", () => {
    expect(planACobrar([BASICO, CADENA], "cadena", BASICO)).toBe(CADENA)
  })

  it("un plan inexistente en la URL no se cobra: queda el actual", () => {
    expect(planACobrar([BASICO, CADENA], "inventado", BASICO)).toBe(BASICO)
  })

  it("la ruta de pago lleva el plan elegido", () => {
    expect(rutaDePago("cadena")).toBe("/admin/suscripcion/activar?plan=cadena")
  })
})
