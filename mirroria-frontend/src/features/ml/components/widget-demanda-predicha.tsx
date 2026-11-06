import { TrendUp, ArrowClockwise } from "@phosphor-icons/react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { DemandaMlResponse, RiesgoQuiebre } from "../types/ml.types"

const BADGE_MAP: Record<RiesgoQuiebre, { cls: string; label: string }> = {
  CRITICO: { cls: "bg-rose-500/15 text-rose-600 border-rose-500/30", label: "Crítico" },
  ALTO: { cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Alto" },
  MEDIO: { cls: "bg-blue-500/15 text-blue-600 border-blue-500/30", label: "Medio" },
  BAJO: { cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "Bajo" },
}

export function WidgetDemandaPredicha({ data, isLoading }: { data?: DemandaMlResponse | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const items = data?.predicciones ?? []
  const chartData = items.slice(0, 5).map((it) => ({
    nombre: it.nombre || it.producto_id.replace("prod_", "").slice(0, 14),
    Demanda: Math.round(it.demanda_proyectada_unidades),
    Stock: it.stock_actual,
    reponer: it.reabastecimiento_sugerido,
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendUp className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">M1: Demanda Proyectada (30 Días)</CardTitle>
          </div>
          {data?.fallback && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
              Heurístico
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Quiebres estimados: <b className="text-foreground">{data?.kpis_resumen.quiebre_stock_rate_pct ?? 0}%</b> | Rotación:{" "}
          <b className="text-foreground">{data?.kpis_resumen.rotacion_proyectada ?? 0}x</b>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="nombre" fontSize={10} tickLine={false} />
              <YAxis fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
              <Bar dataKey="Demanda" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <ArrowClockwise className="size-3.5 text-primary" /> Sugerencia de Reabastecimiento a Proveedor
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {items.slice(0, 4).map((p) => {
              const cfg = BADGE_MAP[p.riesgo_quiebre] ?? BADGE_MAP.BAJO
              return (
                <div key={p.producto_id} className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/30">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium truncate">{p.nombre || p.producto_id}</p>
                    <p className="text-[10px] text-muted-foreground">Stock: {p.stock_actual} | Demanda: {Math.round(p.demanda_proyectada_unidades)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${cfg.cls}`}>{cfg.label}</Badge>
                    <p className="text-[10px] font-semibold text-primary mt-0.5">+{p.reabastecimiento_sugerido} uds</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
