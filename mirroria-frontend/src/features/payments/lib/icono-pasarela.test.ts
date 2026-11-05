import { describe, expect, it } from "vitest"
import { CreditCard, Money, PaypalLogo, QrCode } from "@phosphor-icons/react"
import { iconoDePasarela, MAPA_ICONOS_PASARELA } from "./icono-pasarela"

describe("iconoDePasarela", () => {
  it("mapea credit-card al icono CreditCard de Phosphor", () => {
    expect(iconoDePasarela("credit-card")).toBe(CreditCard)
  })

  it("mapea qr-code al icono QrCode de Phosphor", () => {
    expect(iconoDePasarela("qr-code")).toBe(QrCode)
  })

  it("mapea paypal-logo al icono PaypalLogo de Phosphor", () => {
    expect(iconoDePasarela("paypal-logo")).toBe(PaypalLogo)
  })

  it("mapea money al icono Money de Phosphor", () => {
    expect(iconoDePasarela("money")).toBe(Money)
  })

  it("retorna CreditCard por defecto ante un valor no mapeado", () => {
    // @ts-expect-error probando valor desconocido
    expect(iconoDePasarela("desconocido")).toBe(CreditCard)
  })

  it("el mapa contiene todas las claves de pasarelas", () => {
    expect(MAPA_ICONOS_PASARELA["credit-card"]).toBe(CreditCard)
    expect(MAPA_ICONOS_PASARELA["qr-code"]).toBe(QrCode)
    expect(MAPA_ICONOS_PASARELA["paypal-logo"]).toBe(PaypalLogo)
    expect(MAPA_ICONOS_PASARELA["money"]).toBe(Money)
  })
})
