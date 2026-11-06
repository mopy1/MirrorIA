import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { descargarExcel, reportsApi } from "./reportsApi"

describe("reportsApi - exportarExcel y descargarExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("exportarExcel envía payload correcto y retorna blob", async () => {
    const mockBlob = new Blob(["test"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(mockBlob, {
        status: 200,
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      })
    )

    const payload = {
      ficha: {
        metrica: "ingresos",
        agruparPor: "metodo_pago",
        filtros: {},
        orden: "desc" as const,
        limite: 10,
      },
      filas: [{ clave: "QR", etiqueta: "QR", valor: 1500 }],
      titulo: "Reporte de Ingresos por Método de Pago",
    }

    const resultado = await reportsApi.exportarExcel(payload)
    expect(resultado).toBeInstanceOf(Blob)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/ia/reportes/exportar-excel"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  it("exportarExcel arroja ApiError cuando el servidor responde con error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Error interno" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    )

    const payload = {
      ficha: { metrica: "ingresos", agruparPor: "canal", filtros: {}, orden: "desc" as const, limite: 10 },
    }

    await expect(reportsApi.exportarExcel(payload)).rejects.toThrow("Error interno")
  })

  it("descargarExcel crea enlace invisible, dispara click y revoca URL", () => {
    const mockBlob = new Blob(["data"])
    const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/1234")
    const revokeObjectURLSpy = vi.fn()
    const clickSpy = vi.fn()
    const removeSpy = vi.fn()
    const mockAnchor = {
      href: "",
      download: "",
      click: clickSpy,
      remove: removeSpy,
    }

    vi.stubGlobal("window", {
      URL: {
        createObjectURL: createObjectURLSpy,
        revokeObjectURL: revokeObjectURLSpy,
      },
    })

    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: vi.fn(),
      },
    })

    descargarExcel(mockBlob, "reporte_test.xlsx")

    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob)
    expect(mockAnchor.download).toBe("reporte_test.xlsx")
    expect(mockAnchor.href).toBe("blob:http://localhost/1234")
    expect(clickSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/1234")
  })
})
