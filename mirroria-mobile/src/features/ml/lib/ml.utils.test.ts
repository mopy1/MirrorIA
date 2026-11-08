import { describe, expect, it } from "vitest"
import { formatearNombrePrenda, formatearNombreVenta } from "./ml.utils"
import { leerTab } from "./ml-tabs"
import { ordenarPorUrgencia, textoDuracion, textoReposicion } from "./ml-demanda"
import type { ItemPrediccionDemanda } from "../types/ml.types"

const prenda = (over: Partial<ItemPrediccionDemanda>): ItemPrediccionDemanda => ({
  producto_id: "prod_vestido_seda_01",
  demanda_proyectada_unidades: 15.4,
  stock_actual: 4,
  reabastecimiento_sugerido: 11,
  riesgo_quiebre: "ALTO",
  dias_de_stock_estimados: 7.8,
  ...over,
})

describe("ml.utils", () => {
  it("usa el nombre real y humaniza ids semilla sin mostrar UUIDs", () => {
    expect(formatearNombrePrenda("x", "Blusa de Lino")).toBe("Blusa de Lino")
    expect(formatearNombrePrenda("prod_vestido_seda_01")).toBe("Vestido Seda")
    expect(formatearNombrePrenda("3f2b8c1e-0a4d-4c1b-9f7e-2a1b3c4d5e6f")).toBe("Prenda sin nombre")
  })

  it("formatea ventas como 'Venta #101' y no inventa número para UUIDs", () => {
    expect(formatearNombreVenta("vta_pos_reg_101")).toBe("Venta #101")
    expect(formatearNombreVenta("3f2b8c1e-0a4d-4c1b-9f7e-2a1b3c4d5e61")).toBeNull()
  })
})

describe("ml-tabs", () => {
  it("conserva los valores históricos de ?tab= y cae al resumen si no hay o no es válido", () => {
    expect(leerTab("demanda")).toBe("demanda")
    expect(leerTab("auditoria")).toBe("auditoria")
    expect(leerTab(null)).toBe("resumen")
    expect(leerTab("overview")).toBe("resumen")
  })
})

describe("ml-demanda", () => {
  it("ordena lo más urgente primero", () => {
    const orden = ordenarPorUrgencia([
      prenda({ producto_id: "a", riesgo_quiebre: "BAJO" }),
      prenda({ producto_id: "b", riesgo_quiebre: "CRITICO", dias_de_stock_estimados: 2 }),
      prenda({ producto_id: "c", riesgo_quiebre: "CRITICO", dias_de_stock_estimados: 1 }),
    ])
    expect(orden.map((p) => p.producto_id)).toEqual(["c", "b", "a"])
  })

  it("dice cuánto alcanza el stock en palabras", () => {
    expect(textoDuracion(prenda({}), 30)).toBe("Alcanza para ~8 días")
    expect(textoDuracion(prenda({ stock_actual: 0 }), 30)).toBe("Ya no tenés stock")
    expect(textoDuracion(prenda({ dias_de_stock_estimados: 999 }), 30)).toBe("Alcanza para más de 30 días")
    expect(textoDuracion(prenda({ dias_de_stock_estimados: 0.6 }), 30)).toBe("Se termina hoy o mañana")
  })

  it("arma la frase de reposición y omite el pedido cuando no hace falta", () => {
    expect(textoReposicion(prenda({}), 30)).toBe("Tenés 4 · se venderían ~15 en 30 días · pedí 11 más")
    expect(textoReposicion(prenda({ reabastecimiento_sugerido: 0 }), 7)).toBe("Tenés 4 · se venderían ~15 en 7 días")
  })
})
