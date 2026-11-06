import { Crown, Sparkle, ClockCountdown, Tag } from "@phosphor-icons/react"
import type { ClusterRfmTipo } from "../../types/ml.types"

interface ClusterCardConfig {
  label: string
  color: string
  icon: typeof Crown
  estrategia: string
}

const CLUSTER_CONFIG: Record<ClusterRfmTipo, ClusterCardConfig> = {
  VIPS_LEALES: {
    label: "VIPs / Leales",
    color: "#8b5cf6",
    icon: Crown,
    estrategia: "Acceso exclusivo a colecciones cápsula y preventas",
  },
  POTENCIALES_NUEVAS: {
    label: "Nuevas Promesas",
    color: "#10b981",
    icon: Sparkle,
    estrategia: "Incentivo con cupón 2da compra en 14 días",
  },
  EN_RIESGO_DORMIDAS: {
    label: "En Riesgo / Dormidas",
    color: "#f59e0b",
    icon: ClockCountdown,
    estrategia: "Campaña de rescate con 15% off y catálogo nuevo",
  },
  OCASIONALES_OUTLET: {
    label: "Ocasionales / Outlet",
    color: "#64748b",
    icon: Tag,
    estrategia: "Liquidaciones y remates de fin de mes",
  },
}

interface MlRfmPlaybookProps {
  distribucion?: Record<string, number>
}

/** Tarjetas de recomendación táctica y playbook según cluster RFM. */
export function MlRfmPlaybook({ distribucion = {} }: MlRfmPlaybookProps) {
  const keys: ClusterRfmTipo[] = [
    "VIPS_LEALES",
    "POTENCIALES_NUEVAS",
    "EN_RIESGO_DORMIDAS",
    "OCASIONALES_OUTLET",
  ]

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const cfg = CLUSTER_CONFIG[key]
        const Icon = cfg.icon
        const count = distribucion[key] ?? 0

        return (
          <div
            key={key}
            className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/60 p-2 text-xs transition-colors hover:bg-muted/30"
          >
            <div
              className="mt-0.5 rounded-md p-1.5 shadow-xs"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
            >
              <Icon className="size-3.5" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-foreground">{cfg.label}</span>
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                  {count} clientas
                </span>
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                {cfg.estrategia}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
