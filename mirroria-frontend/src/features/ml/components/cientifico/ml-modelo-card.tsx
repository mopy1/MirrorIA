import { SealCheck, BookOpen, ChartLineUp } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"

export interface ModeloCientificoInfo {
  codigo: string
  algoritmo: string
  autorBib: string
  metricasTexto: string
  kpiAsociado: string
  formulaResumen: string
}

interface MlModeloCardProps {
  modelo: ModeloCientificoInfo
}

/** Tarjeta técnica individual por algoritmo con citas canónicas y métricas rigurosas. */
export function MlModeloCard({ modelo }: MlModeloCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/70 p-4 transition-all hover:border-primary/40 hover:bg-card space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
            <SealCheck className="size-4 text-emerald-500" weight="fill" />
            {modelo.codigo}: {modelo.algoritmo}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/80">
            {modelo.autorBib}
          </Badge>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5">
          <p className="font-mono text-xs font-semibold text-primary">
            {modelo.metricasTexto}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground border-t border-border/40 pt-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <ChartLineUp className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">Impacto KPI:</span>
          <span>{modelo.kpiAsociado}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <BookOpen className="size-3 text-muted-foreground/80" />
          <span className="font-mono">{modelo.formulaResumen}</span>
        </div>
      </div>
    </div>
  )
}
