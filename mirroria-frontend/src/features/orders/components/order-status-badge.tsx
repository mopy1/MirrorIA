import {
  ArrowCounterClockwise,
  CheckCircle,
  Clock,
  Package,
  XCircle,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { EstadoPedido } from "../types/orders.types"

interface OrderStatusBadgeProps {
  estado: EstadoPedido | string
}

const VERDE = "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
const GRIS = "border-border bg-muted text-muted-foreground"

const ESTADO_CONFIG: Record<
  string,
  { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDIENTE: {
    label: "Pendiente de pago",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  PAGADA: { label: "Pagada", classes: VERDE, icon: CheckCircle },
  ENTREGADA: { label: "Entregada", classes: VERDE, icon: Package },
  CANCELADA: {
    label: "Cancelada",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  DEVUELTA_PARCIAL: { label: "Devuelta parcial", classes: GRIS, icon: ArrowCounterClockwise },
  DEVUELTA_TOTAL: { label: "Devuelta", classes: GRIS, icon: ArrowCounterClockwise },
}

export function OrderStatusBadge({ estado }: OrderStatusBadgeProps) {
  const config = ESTADO_CONFIG[estado] ?? {
    label: estado,
    classes: GRIS,
    icon: Clock,
  }
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 font-normal text-xs ${config.classes}`}>
      <Icon className="size-3.5" />
      <span>{config.label}</span>
    </Badge>
  )
}
