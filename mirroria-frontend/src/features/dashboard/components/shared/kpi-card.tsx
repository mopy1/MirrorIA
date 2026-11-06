import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DeltaBadge } from "./delta-badge"
import { cn } from "cn"

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ComponentType<IconProps>
  delta?: number
  tendencia?: "POSITIVA" | "NEGATIVA" | "NEUTRA"
  badgeText?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  onClick?: () => void
  isLoading?: boolean
  className?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delta,
  tendencia,
  badgeText,
  badgeVariant = "outline",
  onClick,
  isLoading,
  className,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <CardContent className="p-0 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 transition-all duration-150 relative overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-sm",
        className,
      )}
    >
      <CardContent className="p-0 flex flex-col justify-between h-full gap-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" weight="duotone" />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
            {value}
          </div>
          {delta !== undefined && <DeltaBadge delta={delta} tendencia={tendencia} />}
          {badgeText && !delta && (
            <Badge variant={badgeVariant} className="text-[10px] uppercase font-semibold">
              {badgeText}
            </Badge>
          )}
        </div>

        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
