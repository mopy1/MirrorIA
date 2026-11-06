import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getDashboardEjecutivo, getDashboardOperativo } from "./dashboardApi"

describe("dashboardApi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe("getDashboardEjecutivo", () => {
    it("llama a /dashboard/ejecutivo sin query params por defecto", async () => {
      const mockResponse = {
        periodo: { clave: "30d", desde: "", hasta: "", sucursalId: null, sucursalNombre: "Todas" },
        kpis: {},
        graficos: {},
        planSaaS: {},
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getDashboardEjecutivo()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/dashboard\/ejecutivo$/),
        expect.anything(),
      )
    })

    it("serializa correctamente los filtros de periodo y sucursal", async () => {
      const mockResponse = { ok: true }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      await getDashboardEjecutivo({
        periodo: "7d",
        sucursalId: "suc-uuid-1",
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/ejecutivo?periodo=7d&sucursalId=suc-uuid-1"),
        expect.anything(),
      )
    })

    it("serializa fechas personalizadas cuando el periodo es personalizado", async () => {
      const mockResponse = { ok: true }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      await getDashboardEjecutivo({
        periodo: "personalizado",
        fechaInicio: "2026-10-01",
        fechaFin: "2026-10-31",
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/ejecutivo?periodo=personalizado&fechaInicio=2026-10-01&fechaFin=2026-10-31"),
        expect.anything(),
      )
    })
  })

  describe("getDashboardOperativo", () => {
    it("llama a /dashboard/operativo sin query params", async () => {
      const mockResponse = { fecha: "2026-11-06", sucursal: {} }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getDashboardOperativo()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/dashboard\/operativo$/),
        expect.anything(),
      )
    })

    it("envía sucursalId cuando se especifica para inspección de admin", async () => {
      const mockResponse = { fecha: "2026-11-06" }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      await getDashboardOperativo({ sucursalId: "suc-local-norte" })
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/operativo?sucursalId=suc-local-norte"),
        expect.anything(),
      )
    })
  })
})
