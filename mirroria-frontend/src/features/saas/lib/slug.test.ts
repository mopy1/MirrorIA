import { describe, expect, it } from "vitest"
import { errorDeSlug, slugDesdeNombre } from "./slug"
import { formatLimite, porcentajeUso } from "@/lib/limites-plan"

describe("slugDesdeNombre", () => {
  it("normaliza acentos, espacios y símbolos", () => {
    expect(slugDesdeNombre("Boutique Lila & Co.")).toBe("boutique-lila-co")
    expect(slugDesdeNombre("  Moda Señorial  ")).toBe("moda-senorial")
  })
})

describe("errorDeSlug", () => {
  it("acepta slugs válidos", () => {
    expect(errorDeSlug("boutique-lila")).toBeNull()
  })
  it("rechaza formato inválido y reservados", () => {
    expect(errorDeSlug("ab")).not.toBeNull()
    expect(errorDeSlug("-lila")).not.toBeNull()
    expect(errorDeSlug("Lila")).not.toBeNull()
    expect(errorDeSlug("admin")).toMatch(/reservada/)
  })
})

describe("formatLimite", () => {
  it("null es ilimitado", () => {
    expect(formatLimite(null, "sucursal", "sucursales")).toBe("Sucursales ilimitadas")
    expect(formatLimite(null, "cuenta de staff", "cuentas de staff")).toBe("Cuentas de staff ilimitadas")
    expect(formatLimite(1, "sucursal", "sucursales")).toBe("1 sucursal")
    expect(formatLimite(50, "prenda activa", "prendas activas")).toBe("50 prendas activas")
  })
  it("porcentajeUso acota a 100 y devuelve null si es ilimitado", () => {
    expect(porcentajeUso(1, 3)).toBe(33)
    expect(porcentajeUso(5, 3)).toBe(100)
    expect(porcentajeUso(5, null)).toBeNull()
  })
})
