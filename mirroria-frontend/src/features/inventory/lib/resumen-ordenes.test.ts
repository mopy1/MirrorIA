import { describe, expect, it } from "vitest"
import type { OrdenCompra } from "../types/purchase-orders.types"
import { resumenPorProveedor } from "./resumen-ordenes"

const orden = (proveedorId: string, estado: OrdenCompra["estado"], pedida: number, recibida: number): OrdenCompra => ({
  id: `${proveedorId}-${estado}`,
  proveedorId,
  sucursalDestinoId: "s1",
  estado,
  items: [{ varianteId: "v1", cantidadPedida: pedida, cantidadRecibida: recibida }],
  fechaPedido: "2026-11-01T10:00:00Z",
  fechaEsperada: null,
  fechaRecepcion: null,
})

describe("resumenPorProveedor", () => {
  it("cuenta solo órdenes abiertas y suma lo que falta recibir", () => {
    const r = resumenPorProveedor([
      orden("p1", "PENDIENTE", 5, 0),
      orden("p1", "RECIBIDA_PARCIAL", 4, 1),
      orden("p1", "RECIBIDA", 3, 3),
      orden("p1", "CANCELADA", 9, 0),
      orden("p2", "CANCELADA", 2, 0),
    ])
    expect(r.get("p1")).toEqual({ abiertas: 2, unidadesEnTransito: 8 })
    expect(r.has("p2")).toBe(false)
  })
})
