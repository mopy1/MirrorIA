import { CheckCircle } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoneyEntero } from "@/lib/money"
import { cn } from "cn"
import { FILAS_LIMITES, formatLimite } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"

interface PasoPlanProps {
  planes: PlanDto[]
  isLoading: boolean
  seleccionado: string
  onSeleccionar: (codigo: string) => void
  error?: string
}

/** Paso 1: elegir plan (tarjetas tipo radio). */
export function PasoPlan({ planes, isLoading, seleccionado, onSeleccionar, error }: PasoPlanProps) {
  if (isLoading) return <div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
  return (
    <div role="radiogroup" aria-label="Plan" className="grid gap-3">
      {planes.map((plan) => {
        const activo = plan.codigo === seleccionado
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onSeleccionar(plan.codigo)}
            className={cn(
              "flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200",
              activo ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/40",
            )}
          >
            <CheckCircle weight={activo ? "fill" : "regular"} className={cn("mt-0.5 size-5 shrink-0", activo ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{plan.nombre}</span>
                <span className="text-sm font-semibold">{formatMoneyEntero(plan.precioMensualCents)}<span className="font-normal text-muted-foreground">/mes</span></span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {FILAS_LIMITES.map((f) => formatLimite(plan.limites[f.clave], f.singular, f.plural)).join(" · ")}
              </span>
            </span>
          </button>
        )
      })}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
