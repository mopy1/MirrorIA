import { ArrowDownRight, ArrowUpRight, Minus } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

interface DeltaBadgeProps {
  delta: number
  tendencia?: "POSITIVA" | "NEGATIVA" | "NEUTRA"
  className?: string
}

export function DeltaBadge({ delta, tendencia, className }: DeltaBadgeProps) {
  const esPositivo = delta > 0 || tendencia === "POSITIVA"
  const esNegativo = delta < 0 || tendencia === "NEGATIVA"

  if (esPositivo) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-0.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
          className,
        )}
      >
        <ArrowUpRight className="size-3" weight="bold" />
        <span>+{Math.abs(delta).toFixed(1)}%</span>
      </Badge>
    )
  }

  if (esNegativo) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-0.5 border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold",
          className,
        )}
      >
        <ArrowDownRight className="size-3" weight="bold" />
        <span>-{Math.abs(delta).toFixed(1)}%</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-0.5 border-neutral-300 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400", className)}
    >
      <Minus className="size-3" weight="bold" />
      <span>0.0%</span>
    </Badge>
  )
}
