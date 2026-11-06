import { ShieldWarning } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AnomaliasVentasResponse } from "../../types/ml.types"
import { MlAnomaliasFeed } from "./ml-anomalias-feed"

interface MlAnomaliasSectionProps {
  data?: AnomaliasVentasResponse | null
  isLoading?: boolean
}

/** Contenedor de la auditoría de ventas POS y detección de anomalías en caja. */
export function MlAnomaliasSection({ data, isLoading }: MlAnomaliasSectionProps) {
  if (isLoading) {
    return (
      <Card className="p-5 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const montoBs = ((data?.monto_sospechoso_cents ?? 0) / 100).toLocaleString()

  return (
    <Card className="flex flex-col shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldWarning className="size-5" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Auditoría POS & Detección de Anomalías
              </CardTitle>
              <CardDescription className="text-xs">
                Contaminación esperada: ν=0.03 · Monto observado: <b className="text-foreground font-mono">Bs {montoBs}</b>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {data?.anomalias_detectadas ?? 0} sospechosas de {data?.total_analizadas ?? 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <MlAnomaliasFeed diagnosticos={data?.diagnosticos} />
      </CardContent>
    </Card>
  )
}
