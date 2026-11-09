import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch, cabecerasTenant, destinoTras401 } from "./api"
import { setTiendaActiva } from "./tienda-activa"

function sesion(slug: string | null) {
  const store: Record<string, string> = { mirroria_token: "jwt-x" }
  store.mirroria_user = JSON.stringify({ id: "u1", tenant: slug ? { id: "t1", slug, nombre: slug } : null })
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => (store[k] = v),
    removeItem: (k: string) => delete store[k],
  })
}

function sinSesion() {
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} })
}

beforeEach(() => setTiendaActiva(null))
afterEach(() => vi.unstubAllGlobals())

describe("cabecerasTenant", () => {
  it("en /t/:slug manda X-Tenant de la URL", () => {
    sinSesion()
    setTiendaActiva("lila")
    expect(cabecerasTenant()).toEqual({ "X-Tenant": "lila" })
  })

  it("sesión de la misma tienda: X-Tenant + token", () => {
    sesion("lila")
    setTiendaActiva("lila")
    expect(cabecerasTenant()).toEqual({ "X-Tenant": "lila", Authorization: "Bearer jwt-x" })
  })

  it("sesión de otra tienda: navega como invitada (sin token)", () => {
    sesion("tiendaria")
    setTiendaActiva("lila")
    expect(cabecerasTenant()).toEqual({ "X-Tenant": "lila" })
  })

  it("en /admin (sin tienda activa) usa el slug de la sesión", () => {
    sesion("tiendaria")
    expect(cabecerasTenant()).toEqual({ "X-Tenant": "tiendaria", Authorization: "Bearer jwt-x" })
  })

  it("dueño de plataforma: token sin X-Tenant", () => {
    sesion(null)
    expect(cabecerasTenant()).toEqual({ Authorization: "Bearer jwt-x" })
  })

  it("modo sesion ignora la tienda navegada; modo ninguno no manda nada", () => {
    sesion("tiendaria")
    setTiendaActiva("lila")
    expect(cabecerasTenant("sesion")).toEqual({ "X-Tenant": "tiendaria", Authorization: "Bearer jwt-x" })
    expect(cabecerasTenant("ninguno")).toEqual({})
  })
})

describe("destinoTras401", () => {
  it("prioriza la tienda navegada, luego plataforma, luego la sesión", () => {
    setTiendaActiva("lila")
    expect(destinoTras401("/t/lila/carrito", null)).toBe("/t/lila/login")
    setTiendaActiva(null)
    expect(destinoTras401("/plataforma/inquilinos", null)).toBe("/plataforma/login")
    expect(destinoTras401("/admin/catalogo", "tiendaria")).toBe("/t/tiendaria/login")
    expect(destinoTras401("/admin/catalogo", null)).toBe("/entrar")
  })
})

describe("apiFetch", () => {
  it("envía X-Tenant y muestra el message del backend (409 de límite)", async () => {
    sesion("lila")
    setTiendaActiva("lila")
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ status: 409, message: "Tu plan Básico permite 1 sucursal", timestamp: "" }),
    })
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("window", { location: { pathname: "/admin" }, dispatchEvent: vi.fn() })

    await expect(apiFetch("/sucursales", { method: "POST" })).rejects.toMatchObject({
      status: 409,
      message: "Tu plan Básico permite 1 sucursal",
    })
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["X-Tenant"]).toBe("lila")
    expect(headers.Authorization).toBe("Bearer jwt-x")
  })

  it("inyecta Idempotency-Key automáticamente en peticiones POST", async () => {
    sinSesion()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await apiFetch("/ventas/checkout", { method: "POST", body: JSON.stringify({ item: 1 }) })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["Idempotency-Key"]).toBeDefined()
    expect(typeof headers["Idempotency-Key"]).toBe("string")
  })

  it("respeta Idempotency-Key explícita si se proporciona", async () => {
    sinSesion()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await apiFetch("/ventas/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": "mi-llave-manual-456" },
      body: JSON.stringify({ item: 1 }),
    })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["Idempotency-Key"]).toBe("mi-llave-manual-456")
  })

  it("captura codigo y detalles en ApiError ante conflicto 409", async () => {
    sinSesion()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          status: 409,
          codigo: "STOCK_AGOTADO_CONFLICTO",
          message: "Prenda sin stock",
          detalles: { prendaNombre: "Vestido Rosa" },
          timestamp: "",
        }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiFetch("/ventas/carrito/u-1/checkout", { method: "POST" })).rejects.toMatchObject({
      status: 409,
      codigo: "STOCK_AGOTADO_CONFLICTO",
      detalles: { prendaNombre: "Vestido Rosa" },
    })
  })
})
