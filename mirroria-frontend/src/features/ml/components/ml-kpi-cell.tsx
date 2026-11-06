import type { ComponentType } from "react"
import { cn } from "cn"

interface MlKpiCellProps {
  label: string
  value: string
  context: string
  icon: ComponentType<{ className?: string; weight?: "duotone" | "fill" | "bold" }>
  trend?: "positive" | "warning" | "negative" | "neutral"
}

const TREND_CLASSES = {
  positive: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  negative: "text-rose-600 bg-rose-500/10 border-rose-500/20",
  neutral: "text-muted-foreground bg-muted/40 border-border/40",
}

/** Celda individual de la franja métrica horizontal continua. */
export function MlKpiCell({ label, value, context, icon: Icon, trend = "neutral" }: MlKpiCellProps) {
  return (
    <div className="flex flex-col justify-between p-4 transition-colors hover:bg-muted/20 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </span>
        <div className={cn("rounded-md border p-1", TREND_CLASSES[trend])}>
          <Icon className="size-3.5" weight="duotone" />
        </div>
      </div>

      <div className="mt-2 space-y-0.5">
        <div className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {value}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {context}
        </p>
      </div>
    </div>
  )
}
