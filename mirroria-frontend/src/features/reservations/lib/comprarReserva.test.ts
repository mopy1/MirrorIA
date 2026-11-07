import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { mensajeErrorCompraReserva, puedeComprarReserva, ventaPendienteDeReserva } from "./comprarReserva"

describe("Comprar lo que reservé", () => {
  it("solo se compra con la reserva EN_TIENDA", () => {
    expect(puedeComprarReserva("EN_TIENDA")).toBe(true)
    for (const e of ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"]) expect(puedeComprarReserva(e)).toBe(false)
  })

  it("encuentra la compra sin pagar que ya salió de la reserva (para no crear otra)", () => {
    const ventas = [
      { id: "v1", reservaId: "r1", estado: "CANCELADA" },
      { id: "v2", reservaId: "r1", estado: "PENDIENTE" },
      { id: "v3", reservaId: "r2", estado: "PENDIENTE" },
    ] as Venta[]
    expect(ventaPendienteDeReserva(ventas, "r1")?.id).toBe("v2")
    expect(ventaPendienteDeReserva(ventas, "r9")).toBeNull()
  })

  it("explica 403/409/sin red en palabras", () => {
    expect(mensajeErrorCompraReserva(new ApiError(403, "Forbidden"))).toMatch(/otra cuenta/)
    expect(mensajeErrorCompraReserva(new ApiError(409, "Solo se compra una reserva cuando el personal te marcó en la tienda"))).toMatch(/personal te marcó/)
    expect(mensajeErrorCompraReserva(new ApiError(0, "x"))).toMatch(/conexión/)
    expect(mensajeErrorCompraReserva(new Error("boom"))).toMatch(/Probá de nuevo/)
  })
})
