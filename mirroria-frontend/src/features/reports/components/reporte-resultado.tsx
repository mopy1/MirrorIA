import { useMemo } from "react"
import { prepararLienzo } from "../lib/lienzo-reporte"
import { textoParaCopiar, metadatosReporte } from "../lib/lienzo-texto"
import type { Reporte } from "../types/reports.types"
import { AccionesReporte } from "./lienzo/acciones-reporte"
import { CifrasClave } from "./lienzo/cifras-clave"
import { ConclusionReporte } from "./lienzo/conclusion-reporte"
import { DatosVacios } from "./lienzo/datos-vacios"
import { EncabezadoReporte } from "./lienzo/encabezado-reporte"
import { SeccionLienzo } from "./lienzo/seccion-lienzo"
import { SeguirPreguntando } from "./lienzo/seguir-preguntando"
import { NarrativaMarkdown } from "./narrativa-markdown"
import { ReasoningSteps } from "./reasoning-steps/reasoning-steps"
import { ReportChart } from "./report-chart"
import { TablaDinamicaReporte } from "./tabla-dinamica-reporte"

interface ReporteResultadoProps {
  reporte: Reporte
  /** La pregunta de la persona: es el título del documento. */
  titulo: string
  generadoEn?: Date
  onPivoteChange?: (dimension: string) => void
  /** Manda una pregunta al asistente; sin ella no se muestra "Seguir preguntando". */
  onPreguntar?: (texto: string) => void
  onCerrar?: () => void
}

/**
 * Lienzo del reporte: un documento de análisis en orden fijo (spec Fase 6b §10.2) —
 * encabezado → conclusión → cifras clave → gráfico → análisis → datos → cómo se armó → seguir preguntando.
 * Una sola superficie con secciones separadas por divisores (sin tarjetas anidadas).
 */
export function ReporteResultado({ reporte, titulo, generadoEn, onPivoteChange, onPreguntar, onCerrar }: ReporteResultadoProps) {
  const l = useMemo(() => prepararLienzo(reporte), [reporte])
  const metadatos = metadatosReporte({ generadoEn, esSimulacion: l.escenario !== undefined, conIa: l.conIa })
  const pasos = reporte.pasosEjecutados ?? []

  return (
    <article className="@container min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <EncabezadoReporte
        titulo={titulo}
        metadatos={metadatos}
        escenario={l.escenario}
        acciones={<AccionesReporte reporte={reporte} titulo={titulo} resumen={textoParaCopiar(titulo, l.conclusion, l.cifras)} onCerrar={onCerrar} />}
      />
      {l.conclusion && <ConclusionReporte texto={l.conclusion} />}

      <div className="divide-y divide-border border-t border-border">
        {l.cifras.length > 0 && (
          <SeccionLienzo titulo="Cifras clave">
            <CifrasClave cifras={l.cifras} />
          </SeccionLienzo>
        )}
        {l.grafico && (
          <SeccionLienzo titulo={l.grafico.titulo}>
            <ReportChart reporte={reporte} />
          </SeccionLienzo>
        )}
        {l.analisis && (
          <SeccionLienzo titulo="Análisis de la IA">
            <NarrativaMarkdown texto={l.analisis} />
          </SeccionLienzo>
        )}
        <SeccionLienzo titulo="Datos">
          {reporte.filas.length > 0 ? (
            <TablaDinamicaReporte reporte={reporte} onPivoteChange={onPivoteChange} />
          ) : (
            <DatosVacios />
          )}
        </SeccionLienzo>
        {pasos.length > 0 && (
          <div className="px-4 py-4 sm:px-7">
            <ReasoningSteps pasos={pasos} />
          </div>
        )}
        {onPreguntar && (
          <SeccionLienzo titulo="Seguir preguntando">
            <SeguirPreguntando preguntaFinal={l.preguntaFinal} sugerencias={l.sugerencias} onPreguntar={onPreguntar} />
          </SeccionLienzo>
        )}
      </div>
    </article>
  )
}
