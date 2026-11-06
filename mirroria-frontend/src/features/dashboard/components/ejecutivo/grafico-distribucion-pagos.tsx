import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DistribucionPagoDto } from "../../types/dashboard.types"

interface GraficoDistribucionPagosProps {
  data?: DistribucionPagoDto[]
  isLoading?: boolean
}

const COLORES: Record<string, string> = {
  STRIPE: "#6366f1",
  WAYRA: "#06b6d4",
  MANUAL: "#10b981",
  EFECTIVO: "#10b981",
  OTRO: "#8b5cf6",
}

export function GraficoDistribucionPagos({ data, isLoading }: GraficoDistribucionPagosProps) {
  if (isLoading) {
    return (
      <Card className="h-88">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44 mb-1" />
          <Skeleton className="h-3.5 w-60" />
        </CardHeader>
        <CardContent className="h-64 pt-4 flex items-center justify-center">
          <Skeleton className="size-44 rounded-full" />
        </CardContent>
      </Card>
    )
  }

  const sinDatos = !data || data.length === 0

  return (
    <Card className="h-88 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Distribución de Pagos</CardTitle>
        <CardDescription className="text-xs">Cuota por pasarela y método de cobro</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-2 flex flex-col justify-between">
        {sinDatos ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
            Sin transacciones en este período.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="montoBs"
                  nameKey="proveedor"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.proveedor} fill={COLORES[entry.proveedor.toUpperCase()] ?? COLORES.OTRO} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as DistribucionPagoDto
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2 shadow-md text-xs">
                        <span className="font-semibold text-popover-foreground">{p.proveedor} ({p.metodo})</span>
                        <div className="text-primary font-bold">Bs {p.montoBs.toFixed(2)} ({p.porcentaje}%)</div>
                        <div className="text-muted-foreground">{p.transacciones} transacciones</div>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-1.5 border-t border-border/60 pt-2 text-xs">
              {data.map((item) => (
                <div key={item.proveedor} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORES[item.proveedor.toUpperCase()] ?? COLORES.OTRO }}
                    />
                    <span className="font-medium text-foreground">{item.proveedor}</span>
                    <span className="text-[11px] text-muted-foreground">({item.metodo})</span>
                  </div>
                  <span className="font-semibold text-foreground">Bs {item.montoBs.toFixed(2)} ({item.porcentaje}%)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
