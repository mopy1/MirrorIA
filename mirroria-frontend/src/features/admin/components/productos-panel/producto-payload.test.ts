import { describe, it, expect } from "vitest"
import { construirPayloadProducto } from "./producto-payload"
import type { ProductoFormData } from "./producto-form-fields"

const BASE: ProductoFormData = {
  categoriaId: "cat-1",
  coleccionId: "col-1",
  titulo: "Vestido negro",
  slug: "vestido-negro",
  descripcion: "Un vestido",
  precio: "349.90",
  imagenUrl: "https://cdn.test/foto.jpg",
  arOverlayImageUrl: "https://cdn.test/overlay.png",
}

describe("construirPayloadProducto", () => {
  it("vaciar la URL de overlay AR manda null, para que el backend la BORRE", () => {
    // Con `undefined` el campo no viaja y `productos.service.ts` solo asigna
    // `if (dto.arOverlayImageUrl !== undefined)`: la admin vaciaba el campo,
    // guardaba, no pasaba nada, y el Vestidor del movil seguia usando la URL
    // vieja. `null` si pasa la validacion (@IsOptional la deja pasar).
    const payload = construirPayloadProducto({ ...BASE, arOverlayImageUrl: "" })
    expect(payload.arOverlayImageUrl).toBeNull()
  })

  it("solo espacios en blanco tambien cuenta como borrar", () => {
    const payload = construirPayloadProducto({ ...BASE, arOverlayImageUrl: "   " })
    expect(payload.arOverlayImageUrl).toBeNull()
  })

  it("una URL de overlay se manda sin espacios sobrantes", () => {
    const payload = construirPayloadProducto({
      ...BASE,
      arOverlayImageUrl: "  https://cdn.test/overlay.png  ",
    })
    expect(payload.arOverlayImageUrl).toBe("https://cdn.test/overlay.png")
  })

  it("convierte el precio a centavos enteros", () => {
    expect(construirPayloadProducto({ ...BASE, precio: "349.90" }).precioCents).toBe(34990)
    expect(construirPayloadProducto({ ...BASE, precio: "0.1" }).precioCents).toBe(10)
  })

  it("sin imagen manda una lista vacia, no una entrada con url vacia", () => {
    expect(construirPayloadProducto({ ...BASE, imagenUrl: "  " }).imagenes).toEqual([])
  })

  it("la descripcion vacia se omite", () => {
    expect(construirPayloadProducto({ ...BASE, descripcion: "" }).descripcion).toBeUndefined()
  })
})
