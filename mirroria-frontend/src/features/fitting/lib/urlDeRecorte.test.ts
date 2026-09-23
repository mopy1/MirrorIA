import { describe, it, expect } from "vitest"
import { urlDeRecorte, RUTA_DE_RECORTES } from "./urlDeRecorte"

const ORIGEN = "http://localhost:5174"

describe("urlDeRecorte", () => {
  it("el caso que rompio el probador entero: la base apunta al dominio de produccion", () => {
    // Esto es literal lo que devuelve el API hoy para las 13 prendas. El
    // recorte NO esta desplegado ahi (lo servido es main, sin esta rama), y
    // nginx contesta index.html con 200, asi que el <img> recibe HTML.
    expect(
      urlDeRecorte("https://mirroria.duckdns.org/prendas/vestido-corto-jazmin.png", ORIGEN),
    ).toBe("http://localhost:5174/prendas/vestido-corto-jazmin.png")
  })

  it("en produccion la reescritura es un no-op: mismo origen, misma URL", () => {
    expect(
      urlDeRecorte(
        "https://mirroria.duckdns.org/prendas/trench-coat-camel.png",
        "https://mirroria.duckdns.org",
      ),
    ).toBe("https://mirroria.duckdns.org/prendas/trench-coat-camel.png")
  })

  it("respeta una URL que un admin subio a otro lado", () => {
    // Si no es una prenda que este frontend sirva, no es asunto nuestro:
    // reescribirla la romperia.
    const ajena = "https://cdn.ejemplo.com/overlays/vestido.png"
    expect(urlDeRecorte(ajena, ORIGEN)).toBe(ajena)
  })

  it("una ruta relativa ya resuelve sola, pero se devuelve absoluta igual", () => {
    expect(urlDeRecorte("/prendas/top-seda-nocturno.png", ORIGEN)).toBe(
      "http://localhost:5174/prendas/top-seda-nocturno.png",
    )
  })

  it("conserva query y fragmento (una URL firmada no se puede podar)", () => {
    expect(
      urlDeRecorte("https://mirroria.duckdns.org/prendas/blusa.png?v=3", ORIGEN),
    ).toBe("http://localhost:5174/prendas/blusa.png?v=3")
  })

  it("sin prenda elegida no hay nada que resolver", () => {
    expect(urlDeRecorte(null, ORIGEN)).toBeNull()
    expect(urlDeRecorte(undefined, ORIGEN)).toBeNull()
    expect(urlDeRecorte("", ORIGEN)).toBeNull()
    expect(urlDeRecorte("   ", ORIGEN)).toBeNull()
  })

  it("una URL sin sentido se devuelve tal cual, para que falle donde se ve", () => {
    // Tragarsela aca dejaria la prenda en silencio sin ponerse; que llegue
    // al <img> y dispare onError, que ya avisa.
    expect(urlDeRecorte("no-es-una-url", ORIGEN)).toBe("no-es-una-url")
  })

  it("no reescribe por el nombre del archivo, sino por la carpeta que servimos", () => {
    // `/uploads/prendas-viejas/x.png` NO es nuestra carpeta publica.
    const otra = "https://mirroria.duckdns.org/uploads/prendas-viejas/x.png"
    expect(urlDeRecorte(otra, ORIGEN)).toBe(otra)
  })

  it("la carpeta publica es la que el sembrador y el repo comparten", () => {
    // Si alguien mueve public/prendas/, esta prueba obliga a mirar el
    // sembrador (scripts/sembrar-catalogo.mjs) y el nginx.
    expect(RUTA_DE_RECORTES).toBe("/prendas/")
  })
})
