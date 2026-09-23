import { describe, it, expect } from "vitest"
import { HERO_CONTENT } from "./hero-section.data"

describe("llamadas a la acción de la portada", () => {
  it("«Ver catálogo» lleva a la tienda", () => {
    expect(HERO_CONTENT.primaryCta.href).toBe("/tienda")
  })

  it("el botón secundario lleva al probador y no al ancla de la portada", () => {
    // Estaba en "#vestidor": la sección que habla del probador, la única de
    // la portada que lo menciona, no lo enlazaba. La clienta hacía clic en
    // el botón grande de arriba y bajaba a leer un texto.
    expect(HERO_CONTENT.secondaryCta.href).toBe("/probador")
  })

  it("las dos rutas son internas (van con <Link>, no con <a href>)", () => {
    // Si alguna vuelve a ser un ancla o una URL absoluta hay que cambiar el
    // componente también: `<Link to="#algo">` no hace scroll a la sección.
    for (const cta of [HERO_CONTENT.primaryCta, HERO_CONTENT.secondaryCta]) {
      expect(cta.href.startsWith("/")).toBe(true)
    }
  })
})
