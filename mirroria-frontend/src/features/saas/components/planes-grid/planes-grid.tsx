import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { esDestacado } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"
import type { Moneda } from "./moneda-toggle"
import { PlanCard } from "./plan-card"

interface PlanesGridProps {
  planes: PlanDto[]
  isLoading: boolean
  error: string | null
  onReintentar: () => void
  moneda: Moneda
}

/** Tarjetas de planes con sus 4 estados. */
export function PlanesGrid({ planes, isLoading, error, onReintentar, moneda }: PlanesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[440px] rounded-2xl" />
        ))}
      </div>
    )
  }
  if (error || planes.length === 0) {
    return (
      <Alert variant={error ? "destructive" : "default"}>
        <WarningCircle />
        <AlertDescription>
          {error ? "No pudimos cargar los planes." : "Todavía no hay planes publicados. Volvé a intentar en unos minutos."}
        </AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" onClick={onReintentar} className="gap-1.5">
            <ArrowClockwise /> Reintentar
          </Button>
        </AlertAction>
      </Alert>
    )
  }
  return (
    <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
      {planes.map((plan) => (
        <PlanCard key={plan.id} plan={plan} destacado={esDestacado(plan, planes)} moneda={moneda} />
      ))}
    </div>
  )
}
