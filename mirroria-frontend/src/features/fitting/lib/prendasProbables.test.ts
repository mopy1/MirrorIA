import { describe, it, expect } from "vitest"
import { elegirPrendaInicial, prendasProbables } from "./prendasProbables"

const p = (id: string, arOverlayImageUrl: string | null) =>
  ({ id, arOverlayImageUrl }) as Parameters<typeof prendasProbables>[0][number]

describe("prendasProbables", () => {
  it("deja solo las prendas que tienen recorte", () => {
    expect(prendasProbables([p("1", "/prendas/a.png"), p("2", null)]).map((x) => x.id)).toEqual(["1"])
  })
})

describe("elegirPrendaInicial", () => {
  it("elige la prenda pedida cuando tiene recorte", () => {
    const lista = [p("1", "/prendas/a.png"), p("2", "/prendas/b.png")]
    expect(elegirPrendaInicial(lista, "2")?.id).toBe("2")
  })

  it("un id que no existe no rompe: abre sin prenda puesta", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", "/prendas/a.png")], "999")).toBeNull()
  })

  it("un producto sin recorte tampoco se pone", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", null)], "1")).toBeNull()
  })

  it("sin id no elige ninguna: la clienta elige de la tira", () => {
    expect(elegirPrendaInicial([p("1", "/prendas/a.png")])).toBeNull()
  })

  it("una prenda marcada como fallida no se vuelve a elegir aunque exista y tenga recorte", () => {
    // Corta el bucle infinito: si el PNG de la prenda del enlace ya falló,
    // no hay que devolverla otra vez.
    const lista = [p("1", "/prendas/a.png")]
    expect(elegirPrendaInicial(lista, "1", new Set(["1"]))).toBeNull()
  })

  it("el conjunto de fallidas vacío o ausente se comporta como antes", () => {
    const lista = [p("1", "/prendas/a.png")]
    expect(elegirPrendaInicial(lista, "1", new Set())?.id).toBe("1")
    expect(elegirPrendaInicial(lista, "1")?.id).toBe("1")
  })
})
