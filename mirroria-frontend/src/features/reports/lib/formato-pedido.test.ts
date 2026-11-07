import { describe, expect, it } from "vitest"
import { formatoPedido, nombreArchivoReporte } from "./formato-pedido"

describe("formato que pide la persona", () => {
  it("reconoce PDF en lenguaje normal", () => {
    expect(formatoPedido("ventas por sucursal en pdf")).toBe("pdf")
    expect(formatoPedido("Generame un PDF con los ingresos")).toBe("pdf")
  })

  it("reconoce Excel", () => {
    expect(formatoPedido("stock por prenda en excel")).toBe("excel")
    expect(formatoPedido("pasalo a una planilla")).toBe("excel")
  })

  it("sin formato se muestra en pantalla", () => {
    expect(formatoPedido("cuanto vendí este mes")).toBeNull()
  })

  it("no se confunde con palabras que solo contienen las letras", () => {
    expect(formatoPedido("productos excelentes del mes")).toBeNull()
  })

  it("el archivo lleva la extensión pedida", () => {
    const fecha = new Date("2026-11-07T12:00:00Z")
    expect(nombreArchivoReporte("Top 5 prendas", "pdf", fecha)).toBe("top-5-prendas_2026-11-07.pdf")
    expect(nombreArchivoReporte("Top 5 prendas", "excel", fecha)).toBe("top-5-prendas_2026-11-07.xlsx")
  })
})
