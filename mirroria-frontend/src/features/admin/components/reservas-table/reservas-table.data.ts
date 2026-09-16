import { CheckCircle, Clock, Storefront, XCircle } from "@phosphor-icons/react"

export const ESTADO_BADGES: Record<
  string,
  { label: string; classes: string; icon: typeof Clock }
> = {
  PENDIENTE: {
    label: "Pendiente",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Clock,
  },
  CONFIRMADA: {
    label: "Confirmada",
    classes: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: CheckCircle,
  },
  EN_TIENDA: {
    label: "En tienda",
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: Storefront,
  },
  COMPLETADA: {
    label: "Completada",
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle,
  },
  CANCELADA: {
    label: "Cancelada",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No asistió",
    classes: "border-muted-foreground/30 bg-muted text-muted-foreground",
    icon: XCircle,
  },
  EXPIRADA: {
    label: "Expirada",
    classes: "border-muted-foreground/30 bg-muted text-muted-foreground",
    icon: XCircle,
  },
}
