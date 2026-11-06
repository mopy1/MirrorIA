import { BookOpen, ChartLineUp } from "@phosphor-icons/react"
import type { ModeloCientificoInfo } from "../../lib/ml-ficha"

/** Bloque técnico por modelo: algoritmo, cita canónica, métricas del set de prueba y KPI asociado. */
export function MlModeloCard({ modelo }: { modelo: ModeloCientificoInfo }) {
  return (
    <article className="space-y-2 rounded-lg border border-border p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {modelo.codigo} · {modelo.algoritmo}
        </h3>
        <span className="text-xs text-muted-foreground">{modelo.autorBib}</span>
      </div>
      <p className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground">{modelo.metricasTexto}</p>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <ChartLineUp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span><span className="font-medium text-foreground">KPI:</span> {modelo.kpiAsociado}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="font-mono">{modelo.formulaResumen}</span>
        </p>
      </div>
    </article>
  )
}
