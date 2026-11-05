import { Badge } from "@/components/ui/badge"
import type { EstadoInquilino, EstadoSuscripcion } from "@/types/tienda.types"
import { cn } from "cn"

const OK = "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
const PENDIENTE = "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
const MAL = "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
const NEUTRO = "border-border bg-muted text-muted-foreground"

const ESTADOS: Record<EstadoSuscripcion | EstadoInquilino, { label: string; clases: string }> = {
  TRIAL: { label: "En prueba", clases: PENDIENTE },
  ACTIVA: { label: "Activa", clases: OK },
  VENCIDA: { label: "Vencida", clases: MAL },
  CANCELADA: { label: "Cancelada", clases: NEUTRO },
  ACTIVO: { label: "Activa", clases: OK },
  SUSPENDIDO: { label: "Suspendida", clases: MAL },
}

/** Badge semántico del estado de una suscripción o de una tienda (spec §1.2). */
export function EstadoBadge({ estado, className }: { estado: EstadoSuscripcion | EstadoInquilino; className?: string }) {
  const cfg = ESTADOS[estado] ?? { label: estado, clases: NEUTRO }
  return (
    <Badge variant="outline" className={cn(cfg.clases, className)}>
      {cfg.label}
    </Badge>
  )
}
