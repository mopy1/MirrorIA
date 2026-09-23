import { describe, it, expect } from "vitest"
import { columnasParaCategorias } from "./columnas"

describe("columnasParaCategorias", () => {
  it("con 4 categorías usa 4 columnas: una fila justa, sin huecos", () => {
    // Es el caso real despues de sacar calzado y accesorios del catalogo.
    expect(columnasParaCategorias(4)).toBe("lg:grid-cols-4")
  })

  it("con 6 categorías usa 6 columnas", () => {
    // Antes estaba fijo en 5 y "Vestidos" quedaba sola en una segunda fila.
    expect(columnasParaCategorias(6)).toBe("lg:grid-cols-6")
  })

  it("con más de 6 no pasa de 6 columnas, porque las tarjetas quedarían ilegibles", () => {
    expect(columnasParaCategorias(9)).toBe("lg:grid-cols-6")
  })

  it("con una sola categoría no estira la tarjeta a lo ancho de la pantalla", () => {
    expect(columnasParaCategorias(1)).toBe("lg:grid-cols-4")
  })
})
