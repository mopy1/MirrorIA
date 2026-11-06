import { Atom, Database } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { MetricasModelosResponse } from "../../types/ml.types"
import { formatearModelos } from "../../lib/ml-ficha"
import { MlModeloCard } from "./ml-modelo-card"

interface MlValidacionCientificaProps {
  data?: MetricasModelosResponse | null
  isLoading?: boolean
}

/** Ficha formal de validación de los 4 modelos (algoritmo, cita y métricas) para la defensa SI2. */
export function MlValidacionCientifica({ data, isLoading }: MlValidacionCientificaProps) {
  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 text-xs tabular-nums">
          <Atom className="size-3" aria-hidden /> seed={data?.semilla_reproducible ?? 42}
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs tabular-nums">
          <Database className="size-3" aria-hidden /> N={(data?.dataset_size_total ?? 10000).toLocaleString("es-BO")}
        </Badge>
        {data?.fecha_evaluacion && <span className="text-xs text-muted-foreground">Evaluado: {data.fecha_evaluacion}</span>}
      </div>
      <div className="space-y-3">
        {formatearModelos(data).map((mod) => <MlModeloCard key={mod.codigo} modelo={mod} />)}
      </div>
    </div>
  )
}
