import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { marcaPorDefecto } from "./marca.constants"
import { aplicarTemaTienda, guardarCacheMarca, leerCacheMarca, limpiarTema, prepararNeutrosTienda } from "./aplicar-tema"

/** <html> mínimo (vitest corre en node, sin jsdom). */
function falsoDocumento() {
  const props = new Map<string, string>()
  const clases = new Set<string>()
  const link = { href: "/favicon.svg", getAttribute: () => link.href, setAttribute: (_: string, v: string) => { link.href = v } }
  const documentElement = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (k: string, v: string) => props.set(k, v),
      removeProperty: (k: string) => props.delete(k),
      getPropertyValue: (k: string) => props.get(k) ?? "",
      get length() { return props.size },
    },
    classList: {
      toggle: (c: string, on: boolean) => (on ? clases.add(c) : clases.delete(c)),
      remove: (c: string) => clases.delete(c),
      add: (c: string) => clases.add(c),
      contains: (c: string) => clases.has(c),
    },
    getAttribute: () => (props.size ? "x" : ""),
    removeAttribute: () => undefined,
  }
  return { documentElement, querySelector: () => link, title: "", link }
}

describe("aplicar y limpiar el tema de una tienda", () => {
  let doc: ReturnType<typeof falsoDocumento>
  beforeEach(() => {
    doc = falsoDocumento()
    vi.stubGlobal("document", doc)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("aplica colores, data-tema y modo oscuro", () => {
    aplicarTemaTienda({ ...marcaPorDefecto("Nómada"), colorPrimario: "#E3C14B", modo: "OSCURO" }, "tienda")
    expect(doc.documentElement.dataset.tema).toBe("tienda")
    expect(doc.documentElement.style.getPropertyValue("--primary")).toBe("#E3C14B")
    expect(doc.documentElement.classList.contains("dark")).toBe(true)
  })

  it("el admin nunca queda en oscuro ni cambia el favicon", () => {
    aplicarTemaTienda({ ...marcaPorDefecto("Nómada"), modo: "OSCURO", logoUrl: "/images/marcas/x.svg" }, "admin")
    expect(doc.documentElement.classList.contains("dark")).toBe(false)
    expect(doc.link.href).toBe("/favicon.svg")
  })

  it("limpiarTema deja <html> como Tiendaria: sin estilos, sin data-tema, sin .dark", () => {
    aplicarTemaTienda({ ...marcaPorDefecto("Casa Andina"), modo: "OSCURO", logoUrl: "/images/marcas/x.svg" }, "tienda")
    expect(doc.link.href).toBe("/images/marcas/x.svg")
    limpiarTema()
    expect(doc.documentElement.style.length).toBe(0)
    expect(doc.documentElement.dataset.tema).toBeUndefined()
    expect(doc.documentElement.classList.contains("dark")).toBe(false)
    expect(doc.link.href).toBe("/favicon.svg")
    expect(doc.title).toBe("Tiendaria")
  })

  it("prepararNeutrosTienda marca la tienda sin colores todavía", () => {
    doc.documentElement.classList.add("dark")
    prepararNeutrosTienda()
    expect(doc.documentElement.dataset.tema).toBe("tienda")
    expect(doc.documentElement.style.length).toBe(0)
    expect(doc.documentElement.classList.contains("dark")).toBe(false)
  })
})

describe("caché local de la marca", () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    vi.stubGlobal("localStorage", { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("guarda y lee por slug; descarta basura", () => {
    guardarCacheMarca("nomada", marcaPorDefecto("Nómada"))
    expect(leerCacheMarca("nomada")?.colorPrimario).toBe("#26282E")
    expect(leerCacheMarca("otra")).toBeNull()
    localStorage.setItem("tiendaria.marca.rota", "{no es json")
    expect(leerCacheMarca("rota")).toBeNull()
  })
})
