import { describe, it, expect } from "vitest"
import {
  debeAplicarPrendaDelEnlace,
  elegirPrendaInicial,
  prendasProbables,
} from "./prendasProbables"

const p = (id: string, tieneFoto: boolean) =>
  ({ id, imagenes: tieneFoto ? [{ url: "/x.jpg", esArAsset: false, orden: 0 }] : [] }) as Parameters<
    typeof prendasProbables
  >[0][number]

describe("prendasProbables", () => {
  it("deja solo las prendas que tienen al menos una foto", () => {
    expect(prendasProbables([p("1", true), p("2", false)]).map((x) => x.id)).toEqual(["1"])
  })
})

describe("elegirPrendaInicial", () => {
  it("elige la prenda pedida cuando tiene foto", () => {
    const lista = [p("1", true), p("2", true)]
    expect(elegirPrendaInicial(lista, "2")?.id).toBe("2")
  })

  it("un id que no existe no rompe: abre sin prenda puesta", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", true)], "999")).toBeNull()
  })

  it("un producto sin foto tampoco se pone", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", false)], "1")).toBeNull()
  })

  it("sin id no elige ninguna: la clienta elige de la tira", () => {
    expect(elegirPrendaInicial([p("1", true)])).toBeNull()
  })

  it("una prenda marcada como fallida no se vuelve a elegir aunque exista y tenga foto", () => {
    // Corta el bucle infinito: si la foto de la prenda del enlace ya falló
    // como referencia, no hay que devolverla otra vez.
    const lista = [p("1", true)]
    expect(elegirPrendaInicial(lista, "1", new Set(["1"]))).toBeNull()
  })

  it("el conjunto de fallidas vacío o ausente se comporta como antes", () => {
    const lista = [p("1", true)]
    expect(elegirPrendaInicial(lista, "1", new Set())?.id).toBe("1")
    expect(elegirPrendaInicial(lista, "1")?.id).toBe("1")
  })
})

describe("debeAplicarPrendaDelEnlace", () => {
  it("sin catálogo todavía no se aplica nada", () => {
    expect(debeAplicarPrendaDelEnlace(null, "1", false)).toBe(false)
  })

  it("con el catálogo cargado y sin aplicar todavía, se aplica", () => {
    expect(debeAplicarPrendaDelEnlace(null, "1", true)).toBe(true)
  })

  it("una vez aplicada la del enlace, no se vuelve a aplicar", () => {
    // El caso real: la prenda elegida a mano falló y se soltó. Sin esto, el
    // efecto reelegía la del enlace y la clienta veía el cartel de error
    // junto con otra prenda puesta.
    expect(debeAplicarPrendaDelEnlace("1", "1", true)).toBe(false)
  })

  it("entrar sin id también cuenta como aplicado", () => {
    expect(debeAplicarPrendaDelEnlace("", undefined, true)).toBe(false)
  })

  it("navegar a otro enlace sí vuelve a aplicar", () => {
    expect(debeAplicarPrendaDelEnlace("1", "2", true)).toBe(true)
  })
})
