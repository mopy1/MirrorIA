import { describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api"
import { agregarLinea, disponibleLocal, quitarLinea, registrarVenta, totalCents, type ItemMostrador } from "./venta-mostrador"

const vestido: ItemMostrador = { varianteId: "v1", productoId: "p1", titulo: "Vestido", talla: "M", color: "Rojo", sku: "S", precioCents: 10000, disponible: 2 }
const PAYLOAD = { sucursalId: "s1", items: [{ varianteId: "v1", cantidad: 1 }] }

function deps(enLinea: boolean, enviar = vi.fn()) {
  return { enLinea: () => enLinea, enviar, encolar: vi.fn(async () => ({ id: "op1" })), generarClave: () => "clave-1" }
}

describe("carrito de mostrador", () => {
  it("no deja vender más de lo disponible", () => {
    let c = agregarLinea([], vestido, 2)
    c = agregarLinea(c, vestido, 2)
    c = agregarLinea(c, vestido, 2)
    expect(c[0].cantidad).toBe(2)
  })

  it("una prenda agotada no se agrega", () => {
    expect(agregarLinea([], vestido, 0)).toEqual([])
  })

  it("suma el total y quita líneas", () => {
    const c = agregarLinea(agregarLinea([], vestido, 2), vestido, 2)
    expect(totalCents(c)).toBe(20000)
    expect(quitarLinea(c, "v1")).toEqual([])
  })

  it("lo vendido sin conexión descuenta el stock local", () => {
    const pendientes = [{ payload: { items: [{ varianteId: "v1", cantidad: 2 }] } }]
    expect(disponibleLocal(vestido, pendientes)).toBe(0)
  })
})

describe("registrar venta", () => {
  it("con red, se registra en el servidor con su clave", async () => {
    const d = deps(true, vi.fn().mockResolvedValue({ id: "venta1" }))
    await expect(registrarVenta(PAYLOAD, d)).resolves.toEqual({ estado: "REGISTRADA", venta: { id: "venta1" } })
    expect(d.enviar).toHaveBeenCalledWith(PAYLOAD, "clave-1")
    expect(d.encolar).not.toHaveBeenCalled()
  })

  it("sin red, queda en la cola y no se intenta enviar", async () => {
    const d = deps(false)
    await expect(registrarVenta(PAYLOAD, d)).resolves.toEqual({ estado: "EN_COLA", operacionId: "op1" })
    expect(d.enviar).not.toHaveBeenCalled()
  })

  it("si la red se cae al enviar, se encola con la MISMA clave: pudo haber llegado", async () => {
    const d = deps(true, vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    await expect(registrarVenta(PAYLOAD, d)).resolves.toMatchObject({ estado: "EN_COLA" })
    expect(d.encolar).toHaveBeenCalledWith(PAYLOAD, "clave-1")
  })

  it("un 500 también va a la cola", async () => {
    const d = deps(true, vi.fn().mockRejectedValue(new ApiError(500, "error")))
    await expect(registrarVenta(PAYLOAD, d)).resolves.toMatchObject({ estado: "EN_COLA" })
  })

  it("sin stock (409) no se encola: se avisa", async () => {
    const d = deps(true, vi.fn().mockRejectedValue(new ApiError(409, "agotado")))
    await expect(registrarVenta(PAYLOAD, d)).rejects.toThrow("agotado")
    expect(d.encolar).not.toHaveBeenCalled()
  })
})
