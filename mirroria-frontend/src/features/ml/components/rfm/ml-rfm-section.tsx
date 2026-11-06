import { UsersThree } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { RfmSegmentosResponse } from "../../types/ml.types"
import { MlRfmDonut } from "./ml-rfm-donut"
import { MlRfmPlaybook } from "./ml-rfm-playbook"

interface MlRfmSectionProps {
  data?: RfmSegmentosResponse | null
  isLoading?: boolean
}

/** Contenedor de la sección de segmentación de clientas RFM y playbook comercial. */
export function MlRfmSection({ data, isLoading }: MlRfmSectionProps) {
  if (isLoading) {
    return (
      <Card className="p-5 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const clvBs = (data?.clv_promedio_bs ?? 0).toLocaleString()

  return (
    <Card className="flex flex-col shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <UsersThree className="size-5" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Segmentación RFM & Playbook
              </CardTitle>
              <CardDescription className="text-xs">
                Clustering no supervisado K-Means (K=4) con CLV proyectado: <b className="text-foreground font-mono">Bs {clvBs}</b>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {data?.total_clientas ?? 0} clientas registradas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <MlRfmDonut distribucion={data?.distribucion_clusters} />
          <MlRfmPlaybook distribucion={data?.distribucion_clusters} />
        </div>
      </CardContent>
    </Card>
  )
}
