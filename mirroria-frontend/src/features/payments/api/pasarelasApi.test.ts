import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { suscripcionApi } from "@/features/subscription/api/suscripcionApi"
import { pasarelasApi } from "./pasarelasApi"

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  })
}

beforeEach(() => {
  mockLocalStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("pasarelasApi", () => {
  it("getPasarelas sin contexto consulta /pagos/pasarelas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: "WAYRA", nombre: "QR Simple" }]),
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await pasarelasApi.getPasarelas()
    expect(res).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pagos/pasarelas"),
      expect.any(Object),
    )
  })

  it("getPasarelas con contexto suscripcion pasa query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal("fetch", fetchMock)

    await pasarelasApi.getPasarelas("suscripcion")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pagos/pasarelas?contexto=suscripcion"),
      expect.any(Object),
    )
  })

  it("getPasarelas con contexto checkout pasa query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal("fetch", fetchMock)

    await pasarelasApi.getPasarelas("checkout")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pagos/pasarelas?contexto=checkout"),
      expect.any(Object),
    )
  })
})

describe("suscripcionApi cobros", () => {
  it("iniciarCobro realiza POST a /saas/mi-suscripcion/cobro", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ cobroId: "c-123", modo: "QR", qrBase64: "base64" }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await suscripcionApi.iniciarCobro({ pasarela: "WAYRA", planCodigo: "CRECIMIENTO" })
    expect(res.cobroId).toBe("c-123")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/saas/mi-suscripcion/cobro"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ pasarela: "WAYRA", planCodigo: "CRECIMIENTO" }),
      }),
    )
  })

  it("estadoCobro realiza GET a /saas/mi-suscripcion/cobro/:id/estado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ cobroId: "c-123", estado: "APROBADO", pagado: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await suscripcionApi.estadoCobro("c-123")
    expect(res.pagado).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/saas/mi-suscripcion/cobro/c-123/estado"),
      expect.any(Object),
    )
  })

  it("simularPago realiza POST a /saas/mi-suscripcion/cobro/:id/simular-pago", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ cobroId: "c-123", estado: "APROBADO", pagado: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await suscripcionApi.simularPago("c-123")
    expect(res.pagado).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/saas/mi-suscripcion/cobro/c-123/simular-pago"),
      expect.objectContaining({ method: "POST" }),
    )
  })
})
