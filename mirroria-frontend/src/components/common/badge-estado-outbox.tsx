import { ArrowsClockwise, CheckCircle, Clock, WarningCircle, XCircle, type Icon } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import type { EstadoOutbox } from "@/lib/offline/idb.types"
import { cn } from "cn"

/** RN09: lo encolado se ve "Pendiente de confirmar", nunca "comprado". Mismo texto que la app móvil (§5.5). */
const ESTADOS_OUTBOX: Record<EstadoOutbox, { label: string; className: string; Icon: Icon }> = {
  PENDIENTE: { label: "Pendiente de confirmar", className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300", Icon: Clock },
  ENVIANDO: { label: "Enviando…", className: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300", Icon: ArrowsClockwise },
  CONFIRMADA: { label: "Confirmada", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300", Icon: CheckCircle },
  COMPENSADA: { label: "Anulada: se agotó", className: "border-destructive/30 bg-destructive/10 text-destructive", Icon: WarningCircle },
  RECHAZADA: { label: "No se pudo", className: "border-border bg-muted text-muted-foreground", Icon: XCircle },
}

export function BadgeEstadoOutbox({ estado, className }: { estado: EstadoOutbox; className?: string }) {
  const cfg = ESTADOS_OUTBOX[estado] ?? ESTADOS_OUTBOX.PENDIENTE
  return (
    <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 text-[11px] font-medium", cfg.className, className)}>
      <cfg.Icon className={cn("size-3", estado === "ENVIANDO" && "animate-spin")} />
      {cfg.label}
    </Badge>
  )
}
