import { describe, expect, it } from "vitest"
import { crearClavesDeIntento, esOperacionDeDinero } from "./clave-intento"

const CHECKOUT = "/ventas/carrito/u1/checkout"
let n = 0
const claves = () => crearClavesDeIntento(() => `clave-${++n}`)

describe("clave de intento", () => {
  it("doble clic en una operación de dinero manda la misma clave", () => {
    const c = claves()
    expect(c.obtener("POST", CHECKOUT, "{}")).toBe(c.obtener("POST", CHECKOUT, "{}"))
  })

  it("si se cayó la red, el reintento conserva la clave", () => {
    const c = claves()
    const primera = c.obtener("POST", CHECKOUT, "{}")
    c.terminar("POST", CHECKOUT, "{}", null)
    expect(c.obtener("POST", CHECKOUT, "{}")).toBe(primera)
  })

  it("un 500 también conserva la clave: pudo haberse guardado", () => {
    const c = claves()
    const primera = c.obtener("POST", CHECKOUT, "{}")
    c.terminar("POST", CHECKOUT, "{}", 500)
    expect(c.obtener("POST", CHECKOUT, "{}")).toBe(primera)
  })

  it("cuando el servidor contesta, la compra siguiente usa otra clave", () => {
    const c = claves()
    const primera = c.obtener("POST", CHECKOUT, "{}")
    c.terminar("POST", CHECKOUT, "{}", 201)
    expect(c.obtener("POST", CHECKOUT, "{}")).not.toBe(primera)
  })

  it("otro cuerpo es otra operación", () => {
    const c = claves()
    expect(c.obtener("POST", CHECKOUT, '{"a":1}')).not.toBe(c.obtener("POST", CHECKOUT, '{"a":2}'))
  })

  it("agregar dos veces al carrito no es doble clic: cada uno lleva su clave", () => {
    const c = claves()
    const ruta = "/ventas/carrito/u1/items"
    expect(c.obtener("POST", ruta, "{}")).not.toBe(c.obtener("POST", ruta, "{}"))
  })

  it("reconoce las operaciones de dinero", () => {
    expect(esOperacionDeDinero(CHECKOUT)).toBe(true)
    expect(esOperacionDeDinero("/ventas/desde-reserva/r1")).toBe(true)
    expect(esOperacionDeDinero("/pagos/p1/confirmar")).toBe(true)
    expect(esOperacionDeDinero("/pagos/ventas/v1/qr")).toBe(true)
    expect(esOperacionDeDinero("/saas/mi-suscripcion/cobro")).toBe(true)
    expect(esOperacionDeDinero("/catalogo/productos")).toBe(false)
  })
})
