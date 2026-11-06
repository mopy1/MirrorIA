import type { Reporte } from "../types/reports.types"
import { calcularCifras, type Cifra } from "./lienzo-cifras"
import { escenarioDelReporte } from "./lienzo-pasos"
import { sugerenciasSeguimiento } from "./lienzo-sugerencias"
import { extraerConclusion, extraerPreguntaFinal, narrativaSinPreguntaFinal, textoPlano } from "./narrativa"
import { elegirFormaGrafico, esReporteSimulado, tituloGrafico } from "./report-chart.utils"

export interface ContenidoLienzo {
  conclusion: string | null
  /** Markdown del análisis, sin título, tablas, pregunta final ni el párrafo que ya es la conclusión. */
  analisis: string
  preguntaFinal: string | null
  cifras: Cifra[]
  sugerencias: string[]
  /** `undefined` si no es simulación; string/null con el escenario si lo es. */
  escenario: string | null | undefined
  grafico: { titulo: string } | null
  conIa: boolean
}

/** Saca del análisis el párrafo que ya se muestra como conclusión (solo si se mostró entero). */
export function analisisSinConclusion(md: string, conclusion: string | null): string {
  if (!conclusion) return md
  const bloques = md.split(/\n\s*\n/)
  const i = bloques.findIndex((b) => textoPlano(b) === conclusion)
  if (i < 0) return md
  bloques.splice(i, 1)
  return bloques.join("\n\n").trim()
}

/** Todo lo que el lienzo muestra, derivado del reporte (lógica pura, sin React). */
export function prepararLienzo(reporte: Reporte): ContenidoLienzo {
  const conclusion = extraerConclusion(reporte.narrativa)
  const preguntaFinal = extraerPreguntaFinal(reporte.narrativa)
  const forma = elegirFormaGrafico(reporte)
  return {
    conclusion,
    analisis: analisisSinConclusion(narrativaSinPreguntaFinal(reporte.narrativa), conclusion),
    preguntaFinal,
    cifras: calcularCifras(reporte),
    sugerencias: sugerenciasSeguimiento(reporte, preguntaFinal, preguntaFinal ? 2 : 3),
    escenario: esReporteSimulado(reporte) ? escenarioDelReporte(reporte) : undefined,
    grafico: forma && (forma === "simulacion" || reporte.filas.length >= 2) ? { titulo: tituloGrafico(reporte) } : null,
    conIa: Boolean(reporte.narrativa?.trim()),
  }
}
