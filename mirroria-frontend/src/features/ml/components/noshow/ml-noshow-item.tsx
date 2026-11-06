import { Clock, User, WhatsappLogo } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ItemEvaluacionNoShow } from "../../types/ml.types"

interface MlNoshowItemProps {
  item: ItemEvaluacionNoShow
  boutiqueNombre: string
}

/** Fila de cita de probador individual con semáforo de riesgo y enlace a WhatsApp. */
export function MlNoshowItem({ item, boutiqueNombre }: MlNoshowItemProps) {
  const tel = item.cliente_telefono?.replace(/\D/g, "")
  const prob = item.probabilidad_no_show > 1 ? item.probabilidad_no_show / 100 : item.probabilidad_no_show
  const esRiesgoso = prob >= 0.35

  const colorBadge = prob >= 0.65
    ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
    : prob >= 0.35
    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"

  const mensajeWa = `Hola ${item.cliente_nombre ?? ""}, te saludamos de ${boutiqueNombre} para reconfirmar tu cita de probador hoy a las ${item.hora_prevista ?? ""}. ¿Nos confirmas tu asistencia?`
  const waUrl = tel ? `https://wa.me/591${tel}?text=${encodeURIComponent(mensajeWa)}` : null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-3 transition-colors hover:bg-muted/30 text-xs">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono font-semibold text-foreground">
            <Clock className="size-3 text-primary" /> {item.hora_prevista ?? "Hoy"}
          </span>
          <span className="truncate text-muted-foreground flex items-center gap-1">
            <User className="size-3 text-muted-foreground/70" /> {item.cliente_nombre ?? item.reserva_id}
          </span>
        </div>
        {item.factores_clave?.length > 0 && (
          <p className="truncate text-[10px] text-muted-foreground">
            {item.factores_clave.join(" • ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`text-[10px] font-mono ${colorBadge}`}>
          {Math.round(prob * 100)}% No-Show
        </Badge>
        {waUrl && esRiesgoso && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="xs"
              variant="outline"
              className="h-7 gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] shadow-xs cursor-pointer"
            >
              <WhatsappLogo className="size-3.5" weight="fill" />
              <span className="hidden sm:inline">Reconfirmar</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
