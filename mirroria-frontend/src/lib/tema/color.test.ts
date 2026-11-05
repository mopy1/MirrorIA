import { describe, expect, it } from "vitest"
import {
  ajustarContraste, BLANCO, contraste, FONDO_TIENDA, formatRatio, hexAOklch, normalizarHex, oklchAHex, textoSobre,
  TINTA, validarPrincipal,
} from "./color"
import { PALETAS } from "./marca.constants"

// Tabla compartida con mirroria-backend/src/modules/saas/marca/marca-color.spec.ts (spec §B.2).
const CASOS: [string, string, number][] = [
  ["#FFFFFF", "#000000", 21],
  ["#820025", "#FFFFFF", 10.6],
  ["#B4441B", "#FFFFFF", 5.55],
  ["#E3C14B", "#0A0A0A", 11.3],
  ["#E3C14B", "#FFFFFF", 1.75], // la spec decía 1.9: el valor real es 1.75
  ["#F5D90A", "#FFFFFF", 1.4], // BE1b-2
]

/** Generador con semilla (resultados repetibles). */
function azar(semilla: number) {
  let s = semilla
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const hexAzar = (r: () => number) => `#${Math.floor(r() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`

describe("contraste WCAG", () => {
  it.each(CASOS)("%s sobre %s ≈ %s", (a, b, esperado) => {
    expect(contraste(a, b)).toBeCloseTo(esperado, 1)
  })

  it("es simétrico", () => {
    expect(contraste("#820025", "#FFFFFF")).toBeCloseTo(contraste("#FFFFFF", "#820025"), 6)
  })

  it("las 6 paletas pasan 4.5:1 en modo claro y su acento lleva texto legible", () => {
    for (const p of Object.values(PALETAS)) {
      expect(validarPrincipal(p.primario, "CLARO").ok).toBe(true)
      expect(contraste(p.acento, textoSobre(p.acento))).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("textoSobre", () => {
  it("blanco sobre colores oscuros y tinta sobre claros", () => {
    expect(textoSobre("#281B89")).toBe(BLANCO)
    expect(textoSobre("#C3F74C")).toBe(TINTA)
  })

  it("en la franja media también supera 4.5 (con #FAFAFA/#141414 no llegaba)", () => {
    expect(contraste("#787878", textoSobre("#787878"))).toBeGreaterThanOrEqual(4.5)
  })

  it("siempre ≥ 4.5:1 sobre 200 colores al azar", () => {
    const r = azar(42)
    for (let i = 0; i < 200; i++) {
      const c = hexAzar(r)
      expect(contraste(c, textoSobre(c))).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("validarPrincipal y formato", () => {
  it("el amarillo de Nómada no pasa en claro pero sí en oscuro", () => {
    expect(validarPrincipal("#E3C14B", "CLARO").ok).toBe(false)
    expect(validarPrincipal("#E3C14B", "OSCURO").ok).toBe(true)
  })

  it("formatea el ratio truncado a un decimal", () => {
    expect(formatRatio(2.19)).toBe("2.1:1")
    expect(formatRatio(21)).toBe("21.0:1")
  })

  it("normaliza hex de 3 y 6 dígitos, en minúscula y sin #", () => {
    expect(normalizarHex("abc")).toBe("#AABBCC")
    expect(normalizarHex("#b4441b")).toBe("#B4441B")
    expect(normalizarHex("rojo")).toBeNull()
  })
})

describe("OKLCH y ajustarContraste", () => {
  it("ida y vuelta conserva el color", () => {
    for (const hex of ["#281B89", "#820025", "#1F4E3B", "#E3C14B"]) {
      expect(oklchAHex(hexAOklch(hex))).toBe(hex)
    }
  })

  it.each([
    ["#F5D90A", "CLARO"],
    ["#E3C14B", "CLARO"],
    ["#F2AACB", "CLARO"],
    ["#0E4D74", "OSCURO"],
    ["#5C1F50", "OSCURO"],
  ] as const)("%s en %s termina ≥ 4.5 y conserva el tono ±2°", (hex, modo) => {
    const ajustado = ajustarContraste(hex, modo)
    expect(contraste(ajustado, FONDO_TIENDA[modo])).toBeGreaterThanOrEqual(4.5)
    const dh = Math.abs(hexAOklch(ajustado).h - hexAOklch(hex).h)
    expect(Math.min(dh, 360 - dh)).toBeLessThanOrEqual(2)
  })

  it("si ya pasa no lo toca", () => {
    expect(ajustarContraste("#820025", "CLARO")).toBe("#820025")
  })

  it("siempre termina ≥ 4.5 sobre 100 colores al azar en ambos modos", () => {
    const r = azar(7)
    for (let i = 0; i < 100; i++) {
      const c = hexAzar(r)
      for (const modo of ["CLARO", "OSCURO"] as const) {
        expect(validarPrincipal(ajustarContraste(c, modo), modo).ok).toBe(true)
      }
    }
  })
})
