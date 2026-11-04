import { CheckCircle, Clock, Package, Truck, XCircle } from "@phosphor-icons/react"
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
  EN_TRANSITO: {
    label: "En tránsito",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    icon: Truck,
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
    className: "border-destructive/30 bg-destructive/10 text-destructive",
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
