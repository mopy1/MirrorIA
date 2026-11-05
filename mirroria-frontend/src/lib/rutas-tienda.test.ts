import { describe, expect, it } from "vitest"
import { rutaLegacy, rutaTienda } from "./rutas-tienda"

describe("rutaTienda", () => {
  it("antepone /t/<slug>", () => {
    expect(rutaTienda("lila", "/carrito")).toBe("/t/lila/carrito")
    expect(rutaTienda("lila", "/tienda/producto/abc")).toBe("/t/lila/tienda/producto/abc")
  })

  it("el inicio de la tienda es /t/<slug> sin barra final", () => {
    expect(rutaTienda("lila", "/")).toBe("/t/lila")
    expect(rutaTienda("lila", "")).toBe("/t/lila")
  })

  it("acepta rutas sin barra y query strings", () => {
    expect(rutaTienda("lila", "tienda")).toBe("/t/lila/tienda")
    expect(rutaTienda("lila", "/tienda?categoria=1")).toBe("/t/lila/tienda?categoria=1")
  })

  it("sin slug deja la ruta igual", () => {
    expect(rutaTienda(null, "/carrito")).toBe("/carrito")
    expect(rutaTienda(undefined, "")).toBe("/")
  })
})

describe("rutaLegacy", () => {
  it("conserva la query string (retorno de Stripe)", () => {
    expect(rutaLegacy("tiendaria", "/pago/exito", "?venta=v1")).toBe("/t/tiendaria/pago/exito?venta=v1")
  })

  it("/register pasa a /registro", () => {
    expect(rutaLegacy("tiendaria", "/register")).toBe("/t/tiendaria/registro")
  })
})
