import { ArrowCounterClockwise, CheckCircle, Clock, Package, XCircle } from "@phosphor-icons/react"

// Claves = EstadoVenta del backend (ventas/entities/venta.entity.ts).
const VERDE = "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
const GRIS = "border-border bg-muted text-muted-foreground"

export const ESTADO_VENTA: Record<
  string,
  { label: string; classes: string; icon: typeof CheckCircle }
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
