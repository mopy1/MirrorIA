import { describe, expect, it } from "vitest"
import { marcaPorDefecto } from "@/lib/tema/marca.constants"
import type { MarcaPublica } from "@/types/marca.types"
import { conBloqueos, opcional, paraGuardar } from "./borrador"
import { REGEX_URL_IMAGEN, validarMarca } from "./validar-marca"

const base = () => ({ ...marcaPorDefecto("Casa Andina"), nombre: "Casa Andina" })

describe("validarMarca", () => {
  it("una marca por defecto es válida", () => {
    expect(validarMarca(base())).toEqual({})
  })

  it("rechaza un principal con poco contraste y muestra el ratio", () => {
    const e = validarMarca({ ...base(), colorPrimario: "#F5D90A" })
    expect(e.colorPrimario).toMatch(/1\.\d:1\)\. Necesita 4\.5:1/)
  })

  it("el mismo amarillo pasa en modo oscuro", () => {
    expect(validarMarca({ ...base(), colorPrimario: "#E3C14B", modo: "OSCURO" }).colorPrimario).toBeUndefined()
  })

  it("solo acepta https o assets propios en las imágenes", () => {
    expect(REGEX_URL_IMAGEN.test("https://images.unsplash.com/photo-1?w=1")).toBe(true)
    expect(REGEX_URL_IMAGEN.test("/images/marcas/mirroria.svg")).toBe(true)
    for (const mala of ["http://x.com/a.jpg", "javascript:alert(1)", "data:image/png;base64,AA", "https://x.com/a b.jpg"]) {
      expect(REGEX_URL_IMAGEN.test(mala)).toBe(false)
    }
    expect(validarMarca({ ...base(), logoUrl: "javascript:alert(1)" }).logoUrl).toBeDefined()
  })

  it("valida largos de portada y formatos de contacto", () => {
    const b = base()
    const e = validarMarca({
      ...b,
      hero: { ...b.hero, titulo: "Hi", ctaTexto: "Un texto de botón demasiado largo" },
      contacto: { ...b.contacto, instagram: "@casa andina", whatsapp: "123", email: "no" },
    })
    expect(Object.keys(e).sort()).toEqual(["contacto.email", "contacto.instagram", "contacto.whatsapp", "hero.ctaTexto", "hero.titulo"])
  })
})

describe("conBloqueos y opcional", () => {
  it("lo que el plan no permite toma el valor efectivo", () => {
    const efectiva: MarcaPublica = marcaPorDefecto("Casa Andina")
    const b = { ...base(), fuente: "playfair" as const, modo: "OSCURO" as const, mostrarInsignia: false }
    const r = conBloqueos(b, efectiva, { estilo: false, imagenesSecciones: false, favicon: false, quitarInsignia: false })
    expect(r.fuente).toBe("geist")
    expect(r.modo).toBe("CLARO")
    expect(r.mostrarInsignia).toBe(true)
    const libre = conBloqueos(b, efectiva, { estilo: true, imagenesSecciones: true, favicon: true, quitarInsignia: true })
    expect(libre.fuente).toBe("playfair")
  })

  it("vacío es null", () => {
    expect(opcional("  ")).toBeNull()
    expect(opcional("casa ")).toBe("casa ") // no recorta mientras se escribe
    expect(paraGuardar({ ...base(), nombre: " Casa Andina ", textos: { eslogan: "  ", sobreNosotros: " Hola " } })).toMatchObject({
      nombre: "Casa Andina",
      textos: { eslogan: null, sobreNosotros: "Hola" },
    })
  })
})
