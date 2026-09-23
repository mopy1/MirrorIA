import { describe, it, expect } from "vitest"
import { estadoDeLista } from "./estado-de-lista"

describe("estadoDeLista", () => {
  it("con elementos, hay datos que mostrar", () => {
    expect(estadoDeLista({ isLoading: false, cantidad: 3 })).toBe("con-datos")
  })

  it("sin elementos y ya cargado, la sección está vacía", () => {
    // Es el caso real de produccion: la base no tiene sucursales ni
    // categorias, y el inicio dejaba un hueco mudo de 350 px bajo el titulo.
    expect(estadoDeLista({ isLoading: false, cantidad: 0 })).toBe("vacio")
  })

  it("mientras carga NO está vacía, aunque todavía no haya nada", () => {
    // Sin esto, al abrir la pagina se ve un parpadeo con "no hay sucursales"
    // antes de que conteste el servidor, que es mentira.
    expect(estadoDeLista({ isLoading: true, cantidad: 0 })).toBe("cargando")
  })
})
