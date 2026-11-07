import { describe, expect, it } from "vitest"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { mezclarCarrito } from "./use-carrito-en-cola"

const op = (estado: OperacionOutbox["estado"], varianteId: string, cantidad = 1) =>
  ({ tipo: "CARRITO_AGREGAR", estado, payload: { varianteId, cantidad } }) as unknown as OperacionOutbox

describe("mezclarCarrito", () => {
  it("suma lo agregado sin red (PENDIENTE/ENVIANDO) al carrito del servidor", () => {
    const carrito = { id: "c1", usuarioId: "u1", items: [{ varianteId: "v1", cantidad: 1 }] }
    const r = mezclarCarrito(carrito, [op("PENDIENTE", "v1"), op("ENVIANDO", "v2", 2)], "u1")
    expect(r?.items).toEqual([{ varianteId: "v1", cantidad: 2 }, { varianteId: "v2", cantidad: 2 }])
    expect(carrito.items[0].cantidad).toBe(1) // no muta el del servidor
  })

  it("ignora lo confirmado o rechazado y arma un carrito local si no hubo lectura", () => {
    expect(mezclarCarrito(null, [op("CONFIRMADA", "v1"), op("RECHAZADA", "v2")], "u1")).toBeNull()
    expect(mezclarCarrito(null, [op("PENDIENTE", "v3")], "u1")).toEqual({ id: "local", usuarioId: "u1", items: [{ varianteId: "v3", cantidad: 1 }] })
  })
})
