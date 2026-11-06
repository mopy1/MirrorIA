import { describe, expect, it } from "vitest"
import { describirFallo, respuestaMeta, textoReporteListo, tituloDesdeTexto } from "./reportes-chat.utils"

const NARRATIVA = `## Top 5 productos

| # | Producto | Unidades |
|---|---|---|
| 1 | Vestido Floral | 10 |

El ranking está **liderado por vestidos**: concentran el 55 % de las unidades.

Recomendaciones:
1. Reponer stock.

¿Querés que lo veamos en ingresos?`

describe("textoReporteListo", () => {
  it("usa solo la conclusión: sin tabla, sin título, sin recomendaciones ni la pregunta final", () => {
    const texto = textoReporteListo(NARRATIVA)
    expect(texto).toBe("El ranking está liderado por vestidos: concentran el 55 % de las unidades.")
  })

  it("sin narrativa da un texto de respaldo", () => {
    expect(textoReporteListo(null)).toMatch(/Listo/)
  })
})

describe("describirFallo", () => {
  it("422 es aclaración con ejemplos clicables, sin reintentar", () => {
    const f = describirFallo(422, "no es una pregunta de negocio")
    expect(f.tono).toBe("aclaracion")
    expect(f.reintentable).toBe(false)
    expect(f.sugerencias).toHaveLength(2)
  })

  it("sin respuesta del servidor ofrece reintentar", () => {
    expect(describirFallo(null)).toMatchObject({ tono: "error", reintentable: true })
  })

  it("503 manda al constructor sin IA y no expone IA_API_KEY", () => {
    const f = describirFallo(503, "falta IA_API_KEY")
    expect(f.texto).toMatch(/sin IA/)
    expect(f.texto).not.toMatch(/IA_API_KEY/)
  })

  it("403 conserva el mensaje del backend (sin sucursal asignada)", () => {
    expect(describirFallo(403, "Tu cuenta no tiene una sucursal asignada").texto).toMatch(/sucursal asignada/)
  })
})

describe("tituloDesdeTexto y respuestaMeta", () => {
  it("normaliza espacios y pone mayúscula inicial sin cortar preguntas normales", () => {
    expect(tituloDesdeTexto("  top 5   productos más vendidos ")).toBe("Top 5 productos más vendidos")
  })

  it("responde localmente '¿qué podés hacer?'", () => {
    expect(respuestaMeta("¿Qué podés hacer?")).toMatch(/datos reales/)
    expect(respuestaMeta("Top 5 productos")).toBeNull()
  })
})
