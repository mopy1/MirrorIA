import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getAnomalias, getModelosMetricas, mlApi } from "./mlApi"

describe("mlApi - Anomalías y Métricas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe("getAnomalias", () => {
    it("llama a /ml/kpis/anomalias/recientes", async () => {
      const mockResponse = {
        total_analizadas: 50,
        anomalias_detectadas: 2,
        tasa_anomalias_pct: 4.0,
        monto_sospechoso_cents: 85000,
        diagnosticos: [],
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getAnomalias()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/ml\/kpis\/anomalias\/recientes$/),
        expect.anything(),
      )
    })

    it("serializa sucursalId en getAnomalias", async () => {
      const mockResponse = { ok: true }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      await getAnomalias({ sucursalId: "suc-norte" })
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/ml/kpis/anomalias/recientes?sucursalId=suc-norte"),
        expect.anything(),
      )
    })
  })

  describe("getModelosMetricas", () => {
    it("llama a /ml/modelos/metricas", async () => {
      const mockResponse = {
        fecha_evaluacion: "2026-11-06T08:00:00Z",
        semilla_reproducible: 42,
        dataset_size_total: 10000,
        modelos: {},
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getModelosMetricas()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/ml\/modelos\/metricas$/),
        expect.anything(),
      )
    })
  })

  describe("mlApi object anomalias y metricas", () => {
    it("exporta getAnomalias y getModelosMetricas", () => {
      expect(mlApi.getAnomalias).toBe(getAnomalias)
      expect(mlApi.getModelosMetricas).toBe(getModelosMetricas)
    })
  })
})
