import { CalendarPlus, CheckCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import type { InquilinoResumenDto } from "../../types/plataforma.types"
import { MiniaturaTienda } from "../miniatura-tienda"

interface Props {
  trials: InquilinoResumenDto[]
  onExtender: (t: InquilinoResumenDto) => void
}

/** Pruebas que vencen en ≤ 7 días, más urgentes primero: Extender (outline) y Gestionar (ghost). */
export function TrialsPorVencer({ trials, onExtender }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Pruebas por vencer</h2>
        {trials.length > 0 && (
          <Link to="/plataforma/inquilinos?suscripcion=TRIAL&orden=por-vencer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Ver todas en prueba
          </Link>
        )}
      </div>
      {trials.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" /> Ninguna prueba vence esta semana.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
          {trials.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3">
              <MiniaturaTienda nombre={t.nombre} marca={t.marca} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.nombre}</p>
                <p className={cn("text-xs", t.suscripcion.diasRestantes <= 2 ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400")}>
                  {t.suscripcion.diasRestantes === 0 ? "Vence hoy" : `Vence en ${t.suscripcion.diasRestantes} ${t.suscripcion.diasRestantes === 1 ? "día" : "días"}`}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => onExtender(t)}><CalendarPlus /> Extender</Button>
              <Link to={`/plataforma/inquilinos/${t.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Gestionar</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
