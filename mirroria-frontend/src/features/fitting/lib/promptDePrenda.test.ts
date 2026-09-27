import { describe, it, expect } from "vitest"
import { promptDePrenda } from "./promptDePrenda"
import type { Producto } from "@/features/catalog/types/catalog.types"

const producto = (titulo: string, descripcion: string | null = null) =>
  ({ titulo, descripcion }) as Producto

describe("promptDePrenda", () => {
  it("usa la categoría (en minúsculas) como lo que se sustituye", () => {
    expect(promptDePrenda(producto("Vestido Floral Primavera"), "Vestidos")).toBe(
      "Substitute the current vestidos with: Vestido Floral Primavera."
    )
  })

  it("agrega la descripción cuando existe", () => {
    expect(promptDePrenda(producto("Blusa Blanca", "Seda, manga larga"), "Blusas")).toBe(
      "Substitute the current blusas with: Blusa Blanca. Seda, manga larga"
    )
  })

  it("sin categoría cae en 'outfit'", () => {
    expect(promptDePrenda(producto("Cinturón de Cuero"))).toBe(
      "Substitute the current outfit with: Cinturón de Cuero."
    )
  })
})
