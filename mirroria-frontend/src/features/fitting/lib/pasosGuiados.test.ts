import { describe, it, expect } from "vitest"
import { calcularPasos } from "./pasosGuiados"

const senales = (p: Partial<Parameters<typeof calcularPasos>[0]> = {}) =>
  calcularPasos({
    hayCamara: false,
    iaConectada: false,
    iaConectando: false,
    prendaElegida: false,
    ...p,
  })

describe("calcularPasos", () => {
  it("al entrar, el primer paso es el de la cámara y los otros esperan", () => {
    const p = senales()
    expect(p.camara).toBe("activo")
    expect(p.ia).toBe("pendiente")
    expect(p.prenda).toBe("pendiente")
    expect(p.completo).toBe(false)
  })

  it("con la cámara andando, el paso activo pasa a ser la conexión con la IA", () => {
    const p = senales({ hayCamara: true, iaConectando: true })
    expect(p.camara).toBe("listo")
    expect(p.ia).toBe("activo")
  })

  it("al entrar sin cámara, el mensaje es exacto", () => {
    expect(senales().mensaje).toBe("Permití la cámara para empezar.")
  })

  it("mientras conecta con la IA, el mensaje lo dice", () => {
    expect(senales({ hayCamara: true, iaConectando: true }).mensaje).toBe("Conectando con la IA…")
  })

  it("si falla la conexión, el mensaje invita a reintentar", () => {
    expect(senales({ hayCamara: true, iaConectando: false }).mensaje).toBe(
      "No se pudo conectar con la IA. Reintentá."
    )
  })

  it("con la IA conectada, toca elegir la prenda", () => {
    const p = senales({ hayCamara: true, iaConectada: true })
    expect(p.ia).toBe("listo")
    expect(p.prenda).toBe("activo")
    expect(p.mensaje).toBe("Elegí una prenda de la tira de abajo.")
    expect(p.completo).toBe(false)
  })

  it("con los tres pasos cumplidos, el panel se da por completo", () => {
    const p = senales({ hayCamara: true, iaConectada: true, prendaElegida: true })
    expect(p.mensaje).toBe("Listo: movete y mirate.")
    expect(p.completo).toBe(true)
  })

  it("si se pierde la conexión con la IA, el paso 2 se vuelve a encender aunque ya haya prenda", () => {
    // Que no quede la pantalla sin prenda y sin explicacion.
    const p = senales({ hayCamara: true, iaConectada: false, prendaElegida: true })
    expect(p.ia).toBe("activo")
    expect(p.prenda).toBe("listo")
    expect(p.completo).toBe(false)
  })

  it("sin cámara, el mensaje de la cámara gana al de la IA", () => {
    expect(senales({ hayCamara: false, iaConectando: true }).mensaje).toBe(
      "Permití la cámara para empezar."
    )
  })

  it("si se desconecta la cámara después de elegir prenda, se vuelve al inicio", () => {
    const p = senales({ hayCamara: false, prendaElegida: true })
    expect(p.camara).toBe("activo")
    expect(p.ia).toBe("pendiente")
    expect(p.prenda).toBe("pendiente")
    expect(p.completo).toBe(false)
  })
})
