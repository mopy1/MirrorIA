import { Skeleton } from "@/components/ui/skeleton"
import type { LimiteRecursoPlanDto, PlanSaaSEjecutivoDto } from "../../types/dashboard.types"
import { EnlaceSeccion } from "../shared/seccion"
import { cn } from "cn"

const RECURSOS: { clave: keyof PlanSaaSEjecutivoDto["limites"]; uno: string; varios: string }[] = [
  { clave: "productos", uno: "prenda", varios: "prendas" },
  { clave: "sucursales", uno: "sucursal", varios: "sucursales" },
  { clave: "usuariosStaff", uno: "persona del equipo", varios: "personas del equipo" },
]

function UsoRecurso({ limite, uno, varios }: { limite: LimiteRecursoPlanDto; uno: string; varios: string }) {
  const nombre = limite.actual === 1 ? uno : varios
  if (limite.maximo === null) {
    return <li className="text-sm text-foreground tabular-nums">{limite.actual} {nombre} <span className="text-muted-foreground">· sin límite</span></li>
  }
  const pct = Math.min(limite.porcentaje ?? 0, 100)
  const cerca = pct >= 80
  return (
    <li className="text-sm tabular-nums">
      <span className="text-foreground">{limite.actual} de {limite.maximo} {varios}</span>
      {cerca && <span className="text-amber-700"> · cerca del límite</span>}
      <div className="mt-1.5 h-1.5 w-full max-w-48 rounded-full bg-muted" aria-hidden>
        <div className={cn("h-full rounded-full", cerca ? "bg-amber-500" : "bg-primary/70")} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </li>
  )
}

/** Uso del plan, compacto y en lenguaje simple ("9 prendas · sin límite"). */
export function UsoPlan({ plan, isLoading }: { plan?: PlanSaaSEjecutivoDto; isLoading?: boolean }) {
  if (isLoading || !plan) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-busy="true">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </section>
    )
  }
  return (
    <section aria-label="Tu plan" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-8">
      <div className="shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Tu plan: {plan.planNombre}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {plan.diasRestantes > 0 ? `Quedan ${plan.diasRestantes} días del período actual` : "El período actual terminó"}
        </p>
      </div>
      <ul className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {RECURSOS.map((r) => (
          <UsoRecurso key={r.clave} limite={plan.limites[r.clave]} uno={r.uno} varios={r.varios} />
        ))}
      </ul>
      <EnlaceSeccion href="/admin/suscripcion">Ver plan</EnlaceSeccion>
    </section>
  )
}
