import { describe, expect, it } from "vitest"
import { analisisSinConclusion, prepararLienzo } from "./lienzo-reporte"
import { reporteDePrueba, TOP5 } from "./lienzo-fixtures.test-utils"

const NARRATIVA = `## Top 5

| # | Producto |
|---|---|
| 1 | Vestido |

Lideran los **vestidos**.

Recomiendo reponer stock.

¿Querés verlo en ingresos?`

describe("prepararLienzo", () => {
  it("conclusión arriba, análisis sin repetirla ni la pregunta final", () => {
    const l = prepararLienzo(reporteDePrueba({ filas: TOP5, narrativa: NARRATIVA }))
    expect(l.conclusion).toBe("Lideran los vestidos.")
    expect(l.analisis).toBe("Recomiendo reponer stock.")
    expect(l.preguntaFinal).toBe("¿Querés verlo en ingresos?")
    expect(l.sugerencias).toHaveLength(2)
    expect(l.grafico?.titulo).toBe("Unidades vendidas por prenda")
    expect(l.conIa).toBe(true)
    expect(l.escenario).toBeUndefined()
  })

  it("sin narrativa (reporte armado sin IA) y una sola fila: sin gráfico", () => {
    const l = prepararLienzo(reporteDePrueba({ filas: TOP5.slice(0, 1) }))
    expect(l.conclusion).toBeNull()
    expect(l.analisis).toBe("")
    expect(l.grafico).toBeNull()
    expect(l.conIa).toBe(false)
  })
})

describe("analisisSinConclusion", () => {
  it("si la conclusión se recortó, no toca el análisis", () => {
    expect(analisisSinConclusion("Uno.\n\nDos.", "Otra cosa…")).toBe("Uno.\n\nDos.")
  })
})
