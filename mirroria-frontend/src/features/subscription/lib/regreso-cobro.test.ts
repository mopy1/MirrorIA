import { describe, expect, it } from "vitest"
import { avisoDeRegreso, estadoInicialRegreso, siguienteEstado } from "./regreso-cobro"

describe("regreso de la pasarela", () => {
  it("con un cobro en la URL no felicita antes de confirmar", () => {
    expect(estadoInicialRegreso("exito", "cobro-1")).toBe("confirmando")
  })

  it("sin cobro (QR ya confirmado por sondeo) se da por pagado", () => {
    expect(estadoInicialRegreso("exito", null)).toBe("pagado")
  })

  it("sin regreso de pasarela no muestra nada", () => {
    expect(estadoInicialRegreso(null, null)).toBeNull()
  })

  it("escribir la URL de exito sin pago no anuncia el pago", () => {
    expect(avisoDeRegreso("pendiente").texto).not.toMatch(/acreditado/i)
  })

  it("cada desenlace tiene su aviso", () => {
    expect(avisoDeRegreso("pagado").tono).toBe("exito")
    expect(avisoDeRegreso("rechazado").tono).toBe("error")
    expect(avisoDeRegreso("error").reintentable).toBe(true)
    expect(avisoDeRegreso("pendiente").reintentable).toBe(true)
  })
})

describe("respuestas cruzadas de la confirmación", () => {
  it("una respuesta tardía de pendiente no pisa un pago ya confirmado", () => {
    expect(siguienteEstado("pagado", { pagado: false, estado: "PENDIENTE" })).toBe("pagado")
  })

  it("pasa a pagado, rechazado o pendiente según responde el backend", () => {
    expect(siguienteEstado("confirmando", { pagado: true, estado: "APROBADO" })).toBe("pagado")
    expect(siguienteEstado("confirmando", { pagado: false, estado: "RECHAZADO" })).toBe("rechazado")
    expect(siguienteEstado("confirmando", { pagado: false, estado: "PENDIENTE" })).toBe("pendiente")
  })
})
