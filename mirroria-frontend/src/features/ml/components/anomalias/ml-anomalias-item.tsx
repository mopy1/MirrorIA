import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { ItemDiagnosticoAnomalia, NivelRiesgoAnomalia } from "../../types/ml.types"

const RIESGO_MAP: Record<NivelRiesgoAnomalia, { label: string; cls: string; icon: typeof CheckCircle }> = {
  NORMAL: { label: "Normal", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  MODERADO: { label: "Sospechoso", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Warning },
  CRITICO: { label: "Atípica / Revisar", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: WarningOctagon },
}

interface MlAnomaliasItemProps {
  diagnostico: ItemDiagnosticoAnomalia
}

/** Fila individual de ticket con indicador de riesgo y motivo identificado por Isolation Forest. */
export function MlAnomaliasItem({ diagnostico }: MlAnomaliasItemProps) {
  const cfg = RIESGO_MAP[diagnostico.nivel_riesgo] ?? RIESGO_MAP.NORMAL
  const Icon = cfg.icon
  const ticketBs = ((diagnostico.monto_total_cents ?? 0) / 100).toFixed(2)

  // Barra de anomalía normalizada (entre 0 y 100%)
  const scorePct = Math.min(Math.max(Math.round(((diagnostico.score_anomalia + 0.5) / 1) * 100), 5), 100)

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card/60 p-2.5 text-xs transition-colors hover:bg-muted/30">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-semibold text-foreground">{diagnostico.venta_id}</span>
          <span className="text-[11px] text-muted-foreground">({diagnostico.metodo_pago ?? "POS"})</span>
          <span className="font-mono font-bold text-primary">Bs {ticketBs}</span>
        </div>

        {diagnostico.motivo_sospecha ? (
          <p className="font-medium text-[11px] text-rose-500 truncate">
            {diagnostico.motivo_sospecha}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground truncate">
            Patrón normal · Score aislamiento: {diagnostico.score_anomalia.toFixed(3)}
          </p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${diagnostico.es_anomalo ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-muted-foreground">
            {diagnostico.score_anomalia.toFixed(2)}
          </span>
        </div>
      </div>

      <Badge variant="outline" className={`gap-1 text-[10px] font-medium shrink-0 ${cfg.cls}`}>
        <Icon className="size-3" weight="bold" />
        <span>{cfg.label}</span>
      </Badge>
    </div>
  )
}
