import { TrendUp, WarningDiamond } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { DemandaMlResponse } from "../../types/ml.types"
import { MlDemandaChart } from "./ml-demanda-chart"
import { MlDemandaTable } from "./ml-demanda-table"

interface MlDemandaSectionProps {
  data?: DemandaMlResponse | null
  isLoading?: boolean
}

/** Sector principal (65%): Demanda Proyectada y Reabastecimiento Crítico (Operate Mode). */
export function MlDemandaSection({ data, isLoading }: MlDemandaSectionProps) {
  if (isLoading) {
    return (
      <Card className="p-5 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-36 w-full" />
      </Card>
    )
  }

  const items = data?.predicciones ?? []
  const quiebresCriticos = items.filter((it) => it.riesgo_quiebre === "CRITICO" || it.riesgo_quiebre === "ALTO").length

  return (
    <Card className="flex flex-col shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <TrendUp className="size-5" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Demanda Proyectada & Reabastecimiento
              </CardTitle>
              <CardDescription className="text-xs">
                Proyección a 30 días calculada mediante Random Forest Regressor (Breiman 2001).
              </CardDescription>
            </div>
          </div>
          {quiebresCriticos > 0 && (
            <Badge variant="outline" className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600 text-[11px] font-medium">
              <WarningDiamond className="size-3.5" weight="fill" />
              <span>{quiebresCriticos} prendas en riesgo de quiebre</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <MlDemandaChart items={items} />
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Plan de Reposición Sugerido</p>
          <MlDemandaTable items={items} />
        </div>
      </CardContent>
    </Card>
  )
}
