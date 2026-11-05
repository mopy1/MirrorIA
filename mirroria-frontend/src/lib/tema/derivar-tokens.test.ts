import { describe, expect, it } from "vitest"
import { derivarTokens, VAR_FUENTE_TITULOS, VARS_TEMA } from "./derivar-tokens"

const MARCA = { colorPrimario: "#B4441B", colorAcento: "#1C3A4A", radio: "RECTO", fuente: "playfair" } as const

describe("derivarTokens", () => {
  it("mapea principal y acento a los tokens de shadcn y al acento de marca", () => {
    const t = derivarTokens(MARCA, "tienda")
    expect(t["--primary"]).toBe("#B4441B")
    expect(t["--ring"]).toBe("#B4441B")
    expect(t["--sidebar-primary"]).toBe("#B4441B")
    expect(t["--brand-accent"]).toBe("#1C3A4A")
    expect(t["--chart-1"]).toBe("#B4441B")
    expect(t["--chart-2"]).toBe("#1C3A4A")
  })

  it("nunca pisa --accent (es el hover de shadcn, no el acento de marca)", () => {
    expect(derivarTokens(MARCA, "tienda")).not.toHaveProperty("--accent")
  })

  it("calcula el texto sobre cada color", () => {
    const t = derivarTokens({ ...MARCA, colorPrimario: "#E3C14B" }, "tienda")
    expect(t["--primary-foreground"]).toBe("#000000")
    expect(t["--brand-accent-foreground"]).toBe("#FFFFFF")
  })

  it("la tienda lleva radio y fuente; el admin no", () => {
    const tienda = derivarTokens(MARCA, "tienda")
    expect(tienda["--radius"]).toBe("0.25rem")
    expect(tienda[VAR_FUENTE_TITULOS]).toContain("Playfair Display Variable")
    const admin = derivarTokens(MARCA, "admin")
    expect(admin).not.toHaveProperty("--radius")
    expect(admin).not.toHaveProperty(VAR_FUENTE_TITULOS)
  })

  it("todo lo que escribe está en VARS_TEMA (así limpiarTema lo borra)", () => {
    for (const k of Object.keys(derivarTokens(MARCA, "tienda"))) expect(VARS_TEMA).toContain(k)
  })
})
