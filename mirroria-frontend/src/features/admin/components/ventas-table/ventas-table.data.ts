import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react"

export const ESTADO_VENTA: Record<
  string,
  { label: string; classes: string; icon: typeof CheckCircle }
> = {
  PAGADO: {
    label: "Pagado",
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle,
  },
  COMPLETADO: {
    label: "Completado",
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle,
  },
  PENDIENTE: {
    label: "Pendiente",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  CANCELADO: {
    label: "Cancelado",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
}
