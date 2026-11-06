import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getAnomalias, getDemanda, getModelosMetricas, getNoShowAgenda, getRfmSegmentos, mlApi } from "./mlApi"

describe("mlApi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe("getDemanda", () => {
    it("llama a /ml/kpis/demanda sin query params por defecto", async () => {
      const mockResponse = {
        horizonte_dias: 30,
        total_items_evaluados: 2,
        predicciones: [],
        kpis_resumen: { quiebre_stock_rate_pct: 12.5, rotacion_proyectada: 4.2 },
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getDemanda()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/ml\/kpis\/demanda$/),
        expect.anything(),
      )
    })

    it("serializa parametros dias y sucursalId", async () => {
      const mockResponse = { ok: true }
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      await getDemanda({ dias: 7, sucursalId: "suc-1" })
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/ml/kpis/demanda?dias=7&sucursalId=suc-1"),
        expect.anything(),
      )
    })
  })

  describe("getNoShowAgenda", () => {
    it("llama a /ml/kpis/no-show/agenda-hoy", async () => {
      const mockResponse = {
        evaluaciones: [],
        tasa_no_show_esperada_pct: 18.5,
        alertas_criticas_count: 1,
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getNoShowAgenda({ sucursalId: "suc-centro" })
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/ml/kpis/no-show/agenda-hoy?sucursalId=suc-centro"),
        expect.anything(),
      )
    })
  })

  describe("getRfmSegmentos", () => {
    it("llama a /ml/kpis/rfm/segmentos", async () => {
      const mockResponse = {
        total_clientas: 1500,
        distribucion_clusters: { VIPS_LEALES: 250 },
        clientas_clasificadas: [],
        tasa_retencion_estimada_pct: 82.4,
        clv_promedio_bs: 3450,
      }

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

      const res = await getRfmSegmentos()
      expect(res).toEqual(mockResponse)
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/ml\/kpis\/rfm\/segmentos$/),
        expect.anything(),
      )
    })
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

  describe("mlApi object", () => {
    it("exporta todos los métodos esperados", () => {
      expect(mlApi.getDemanda).toBe(getDemanda)
      expect(mlApi.getNoShowAgenda).toBe(getNoShowAgenda)
      expect(mlApi.getRfmSegmentos).toBe(getRfmSegmentos)
      expect(mlApi.getAnomalias).toBe(getAnomalias)
      expect(mlApi.getModelosMetricas).toBe(getModelosMetricas)
    })
  })
})
