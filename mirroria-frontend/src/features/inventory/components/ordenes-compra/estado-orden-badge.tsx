import { CheckCircle, Clock, Package, XCircle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { EstadoOrdenCompra } from "../../types/purchase-orders.types"

interface EstadoOrdenBadgeProps {
  estado: EstadoOrdenCompra
}

const ESTADOS_CONFIG: Record<
  EstadoOrdenCompra,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  RECIBIDA_PARCIAL: {
    label: "Parcial",
    className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    icon: Package,
  },
  RECIBIDA: {
    label: "Recibida",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle,
  },
  CANCELADA: {
    label: "Cancelada",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
}

export function EstadoOrdenBadge({ estado }: EstadoOrdenBadgeProps) {
  const config = ESTADOS_CONFIG[estado] ?? {
    label: estado,
    className: "border-muted bg-muted text-muted-foreground",
    icon: Clock,
  }
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 font-normal text-xs ${config.className}`}>
      <Icon className="size-3.5" />
      <span>{config.label}</span>
    </Badge>
  )
}
