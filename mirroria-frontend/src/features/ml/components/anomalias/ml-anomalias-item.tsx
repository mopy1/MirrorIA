import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { formatearNombreTicket } from "../../lib/ml.utils"
import type { ItemDiagnosticoAnomalia, NivelRiesgoAnomalia } from "../../types/ml.types"
import { humanizarAnomalia } from "../../lib/ml-anomalias.utils"

const RIESGO_MAP: Record<
  NivelRiesgoAnomalia,
  { label: string; cls: string; icon: typeof CheckCircle }
> = {
  NORMAL: {
    label: "Normal",
    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle,
  },
  MODERADO: {
    label: "Sospechoso",
    cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Warning,
  },
  CRITICO: {
    label: "Atípica / Revisar",
    cls: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    icon: WarningOctagon,
  },
}

interface MlAnomaliasItemProps {
  diagnostico: ItemDiagnosticoAnomalia
}

/** Fila individual de ticket con badges ejecutivos y descripción comprensible. */
export function MlAnomaliasItem({ diagnostico }: MlAnomaliasItemProps) {
  const cfg = RIESGO_MAP[diagnostico.nivel_riesgo] ?? RIESGO_MAP.NORMAL
  const Icon = cfg.icon
  const ticketBs = ((diagnostico.monto_total_cents ?? 0) / 100).toFixed(2)
  const { badges, descripcion } = humanizarAnomalia(diagnostico)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/60 p-2.5 text-xs transition-colors hover:bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{formatearNombreTicket(diagnostico.venta_id)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">({diagnostico.venta_id})</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
            {diagnostico.metodo_pago ?? "POS"}
          </span>
          <span className="font-mono font-bold text-primary">Bs {ticketBs}</span>
        </div>
        <Badge variant="outline" className={`gap-1 text-[10px] font-medium shrink-0 ${cfg.cls}`}>
          <Icon className="size-3" weight="bold" />
          <span>{cfg.label}</span>
        </Badge>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {badges.map((b) => (
            <Badge
              key={b}
              variant="outline"
              className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-medium"
            >
              {b}
            </Badge>
          ))}
        </div>
      )}

      <p
        className={`text-[11px] leading-relaxed ${
          diagnostico.es_anomalo ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        {descripcion}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
        <span>
          Score aislamiento: <span className="font-mono">{diagnostico.score_anomalia.toFixed(3)}</span>
        </span>
        {diagnostico.hora_venta !== undefined && (
          <span>Hora: {String(diagnostico.hora_venta).padStart(2, "0")}:00</span>
        )}
      </div>
    </div>
  )
}
