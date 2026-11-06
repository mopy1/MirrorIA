import { UsersThree, Crown, Sparkle, ClockCountdown, Tag } from "@phosphor-icons/react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { ClusterRfmTipo, RfmSegmentosResponse } from "../types/ml.types"

const CLUSTER_CONFIG: Record<ClusterRfmTipo, { label: string; color: string; icon: typeof Crown; estrategia: string }> = {
  VIPS_LEALES: { label: "VIPs / Leales", color: "#8b5cf6", icon: Crown, estrategia: "Acceso exclusivo a colecciones cápsula" },
  POTENCIALES_NUEVAS: { label: "Nuevas Promesas", color: "#10b981", icon: Sparkle, estrategia: "Cupón 2da compra en 14 días" },
  EN_RIESGO_DORMIDAS: { label: "En Riesgo / Dormidas", color: "#f59e0b", icon: ClockCountdown, estrategia: "Campaña rescate con cupón 15%" },
  OCASIONALES_OUTLET: { label: "Ocasionales / Outlet", color: "#64748b", icon: Tag, estrategia: "Liquidaciones y remates de fin de mes" },
}

export function WidgetRfmSegmentos({ data, isLoading }: { data?: RfmSegmentosResponse | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full" />
      </Card>
    )
  }

  const dist = data?.distribucion_clusters ?? {}
  const pieData = Object.entries(dist).map(([key, value]) => ({
    name: CLUSTER_CONFIG[key as ClusterRfmTipo]?.label ?? key,
    value: Number(value),
    color: CLUSTER_CONFIG[key as ClusterRfmTipo]?.color ?? "#6366f1",
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersThree className="size-5 text-primary" weight="duotone" />
            <CardTitle className="text-base font-semibold">M3: Segmentación RFM (K-Means K=4)</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {data?.total_clientas ?? 0} clientas
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Retención proyectada: <b className="text-foreground">{data?.tasa_retencion_estimada_pct ?? 0}%</b> | CLV Promedio:{" "}
          <b className="text-foreground">Bs {data?.clv_promedio_bs?.toLocaleString() ?? 0}</b>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {(Object.keys(CLUSTER_CONFIG) as ClusterRfmTipo[]).map((key) => {
              const cfg = CLUSTER_CONFIG[key]
              const Icon = cfg.icon
              const count = dist[key] ?? 0
              return (
                <div key={key} className="flex items-start gap-2 p-1.5 rounded-md border border-border/50 bg-card/60 text-xs">
                  <div className="p-1 rounded bg-muted/60 text-primary mt-0.5">
                    <Icon className="size-3.5" style={{ color: cfg.color }} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{cfg.label}</span>
                      <span className="font-mono text-muted-foreground">{count}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{cfg.estrategia}</p>
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
