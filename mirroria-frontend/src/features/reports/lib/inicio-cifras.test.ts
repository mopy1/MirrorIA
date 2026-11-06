import { describe, expect, it } from "vitest"
import { formatMoney } from "@/lib/money"
import type { FilaReporte, Reporte } from "../types/reports.types"
import { armarCifras, type DatosCifras } from "./inicio-cifras"

function rep(filas: Partial<FilaReporte>[]): Reporte {
  return {
    ficha: { metrica: "x", agruparPor: "ninguno", filtros: {}, orden: "desc", limite: 20 },
    filas: filas.map((f, i) => ({ clave: String(i), etiqueta: "Total", valor: 0, ...f })),
    comparacion: null,
    narrativa: null,
  }
}

const COMPLETO: DatosCifras = {
  ingresos: rep([{ valor: 712000 }]),
  ventas: rep([{ valor: 5 }]),
  reservas: rep([
    { clave: "COMPLETADA", etiqueta: "COMPLETADA", valor: 1 },
    { clave: "CANCELADA", etiqueta: "CANCELADA", valor: 1 },
    { clave: "NO_SHOW", etiqueta: "NO_SHOW", valor: 1 },
    { clave: "PENDIENTE", etiqueta: "PENDIENTE", valor: 2 },
  ]),
  productos: rep([{ valor: 9 }]),
  categorias: rep([{ valor: 1 }]),
}

describe("armarCifras", () => {
  it("cada cifra trae valor formateado y contexto en palabras", () => {
    const [vendido, promedio, reservas, catalogo] = armarCifras(COMPLETO)
    expect(vendido.valor).toBe(formatMoney(712000))
    expect(vendido.contexto).toBe("En 5 compras pagadas")
    expect(promedio.valor).toBe(formatMoney(142400))
    expect(reservas.valor).toBe("5")
    expect(reservas.contexto).toBe("1 terminó en compra · 2 no se concretaron")
    expect(catalogo.contexto).toBe("Organizadas en 1 categoría")
    expect(armarCifras(COMPLETO).every((c) => !c.cargando)).toBe(true)
  })

  it("sin ventas no divide por cero ni inventa un promedio", () => {
    const [vendido, promedio] = armarCifras({ ...COMPLETO, ingresos: rep([{ valor: 0 }]), ventas: rep([{ valor: 0 }]) })
    expect(vendido.contexto).toBe("Todavía no hay compras pagadas")
    expect(promedio.valor).toBeNull()
    expect(promedio.contexto).toBe("Aparece con la primera venta")
  })

  it("distingue cargando (undefined) de fallo (null)", () => {
    const cifras = armarCifras({ ...COMPLETO, ingresos: undefined, reservas: null })
    expect(cifras[0].cargando).toBe(true)
    expect(cifras[2].cargando).toBe(false)
    expect(cifras[2].valor).toBeNull()
    expect(cifras[2].contexto).toMatch(/No se pudo cargar/)
  })

  it("sin reservas lo dice en vez de mostrar 0 a secas", () => {
    expect(armarCifras({ ...COMPLETO, reservas: rep([]) })[2].contexto).toBe("Todavía nadie reservó una prenda")
  })
})
