import { describe, expect, it } from "vitest"
import { extraerConclusion, extraerPreguntaFinal, limpiarNarrativa, narrativaSinPreguntaFinal, textoPlano } from "./narrativa"

const IA = `## Top 5 productos más vendidos (por unidades)

| # | Producto | Unidades |
|---|----------|----------|
| 1 | Vestido Floral Primavera | 10 |

### Narrativa ejecutiva

El ranking está **liderado por vestidos**: "Vestido Floral" (10 uds.) concentra el top. Esto sugiere demanda sólida.

**Recomendaciones:**
1. **Priorizar reposición** de vestidos.
2. Explorar venta cruzada.

¿Quieres que profundice en ingresos?`

describe("narrativa", () => {
  it("quita tablas markdown y el título inicial", () => {
    const limpio = limpiarNarrativa(IA)
    expect(limpio).not.toContain("|")
    expect(limpio.startsWith("## Top 5")).toBe(false)
    expect(limpio).toContain("### Narrativa ejecutiva")
  })

  it("extrae la conclusión en texto plano, sin encabezados ni listas", () => {
    expect(extraerConclusion(IA)).toBe(
      'El ranking está liderado por vestidos: "Vestido Floral" (10 uds.) concentra el top. Esto sugiere demanda sólida.',
    )
  })

  it("recorta la conclusión en un fin de frase", () => {
    const largo = `${"Frase uno larga de prueba. ".repeat(20)}`
    const c = extraerConclusion(largo, 100)!
    expect(c.length).toBeLessThanOrEqual(100)
    expect(c.endsWith(".")).toBe(true)
  })

  it("detecta y separa la pregunta final de seguimiento", () => {
    expect(extraerPreguntaFinal(IA)).toBe("¿Quieres que profundice en ingresos?")
    expect(narrativaSinPreguntaFinal(IA)).not.toContain("¿Quieres")
    expect(extraerPreguntaFinal("Todo bien.")).toBeNull()
  })

  it("convierte markdown inline a texto plano", () => {
    expect(textoPlano("**hola** _mundo_ `x` [link](http://a)")).toBe("hola mundo x link")
  })

  it("saltea la frase de introducción con dos puntos y usa el primer punto de la lista", () => {
    const md = "Resultado de la consulta: el sistema devolvió un único registro:\n\n### Lectura\n\n- **Cobertura insuficiente:** solo hay 1 día con ventas."
    expect(extraerConclusion(md)).toBe("Cobertura insuficiente: solo hay 1 día con ventas.")
  })

  it("tolera vacío o null", () => {
    expect(limpiarNarrativa(null)).toBe("")
    expect(extraerConclusion(undefined)).toBeNull()
  })
})
