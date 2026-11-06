import { ShieldWarning, WarningOctagon, CheckCircle, Warning } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AnomaliasVentasResponse, NivelRiesgoAnomalia } from "../types/ml.types"

const RIESGO_MAP: Record<NivelRiesgoAnomalia, { label: string; cls: string; icon: typeof CheckCircle }> = {
  NORMAL: { label: "Normal", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  MODERADO: { label: "Sospechoso", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Warning },
  CRITICO: { label: "Atípica / Revisar", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: WarningOctagon },
}

export function WidgetAnomaliasVentas({ data, isLoading }: { data?: AnomaliasVentasResponse | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const items = data?.diagnosticos ?? []
  const montoBs = ((data?.monto_sospechoso_cents ?? 0) / 100).toLocaleString()

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldWarning className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">Auditoría de Ventas POS</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {data?.anomalias_detectadas ?? 0} atípicas / {data?.total_analizadas ?? 0}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Tasa atípica: <b className="text-foreground">{data?.tasa_anomalias_pct ?? 0}%</b> · Importe auditado en observación:{" "}
          <b className="text-foreground font-semibold">Bs {montoBs}</b>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
            No se detectaron irregularidades en las ventas recientes.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.slice(0, 5).map((diag) => {
              const cfg = RIESGO_MAP[diag.nivel_riesgo] ?? RIESGO_MAP.NORMAL
              const Icon = cfg.icon
              const ticketBs = ((diag.monto_total_cents ?? 0) / 100).toFixed(2)
              return (
                <div key={diag.venta_id} className="flex items-start justify-between p-2 rounded-md border border-border/60 bg-muted/20 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="font-mono text-foreground">{diag.venta_id}</span>
                      <span className="text-muted-foreground">({diag.metodo_pago ?? "POS"})</span>
                      <span className="font-semibold text-primary">Bs {ticketBs}</span>
                    </div>
                    {diag.motivo_sospecha ? (
                      <p className="text-[10px] text-rose-500 font-medium mt-0.5">{diag.motivo_sospecha}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Patrón normal | Score: {diag.score_anomalia.toFixed(3)}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 gap-1 ${cfg.cls}`}>
                    <Icon className="size-3" weight="bold" />
                    {cfg.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
