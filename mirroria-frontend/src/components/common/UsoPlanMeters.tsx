import { FILAS_LIMITES, porcentajeUso } from "@/lib/limites-plan"
import type { LimitesPlanDto, UsoPlanDto } from "@/types/plan.types"
import { cn } from "cn"

/** Barras uso / límite del plan (suscripción del ADMIN y detalle de la plataforma). */
export function UsoPlanMeters({ uso, limites }: { uso: UsoPlanDto; limites: LimitesPlanDto }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-3">
      {FILAS_LIMITES.map((f) => {
        const usado = uso[f.uso]
        const limite = limites[f.clave]
        const pct = porcentajeUso(usado, limite)
        const tono = pct === null ? "bg-primary/40" : pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-primary"
        return (
          <li key={f.clave} className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{f.plural}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {usado}
              <span className="text-sm font-normal text-muted-foreground"> / {limite ?? "∞"}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`Uso de ${f.plural}`}>
              <div className={cn("h-full rounded-full transition-all", tono)} style={{ width: `${pct ?? 15}%` }} />
            </div>
            <p className={cn("mt-2 text-xs", pct !== null && pct >= 100 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {pct === null ? "Sin límite en el plan" : pct >= 100 ? "Límite del plan alcanzado" : `${limite! - usado} disponibles`}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
