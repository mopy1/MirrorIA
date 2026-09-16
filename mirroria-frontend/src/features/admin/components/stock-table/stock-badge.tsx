import { Badge } from "@/components/ui/badge"

export function StockBadge({ cantidad }: { cantidad: number }) {
  if (cantidad <= 0) {
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-xs">
        0 u. (Agotado)
      </Badge>
    )
  }
  if (cantidad <= 5) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-xs">
        {cantidad} u. (Bajo)
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs">
      {cantidad} u.
    </Badge>
  )
}
