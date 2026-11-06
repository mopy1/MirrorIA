import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TendenciaIngresoDiaDto } from "../../types/dashboard.types"

interface GraficoTendenciaIngresosProps {
  data?: TendenciaIngresoDiaDto[]
  isLoading?: boolean
}

export function GraficoTendenciaIngresos({ data, isLoading }: GraficoTendenciaIngresosProps) {
  if (isLoading) {
    return (
      <Card className="h-88">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48 mb-1" />
          <Skeleton className="h-3.5 w-72" />
        </CardHeader>
        <CardContent className="h-64 pt-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const sinDatos = !data || data.length === 0

  return (
    <Card className="h-88 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tendencia de Ingresos</CardTitle>
        <CardDescription className="text-xs">Evolución diaria de facturación en Bolivianos (Bs)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-2">
        {sinDatos ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
            No se registran ventas en el período seleccionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickFormatter={(val: string) => {
                  const partes = val.split("-")
                  return partes.length === 3 ? `${partes[2]}/${partes[1]}` : val
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickFormatter={(v: number) => `Bs ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload as TendenciaIngresoDiaDto
                  return (
                    <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs">
                      <p className="font-semibold text-popover-foreground">{item.fecha}</p>
                      <p className="text-primary font-bold mt-1">Bs {item.ingresosBs.toFixed(2)}</p>
                      <p className="text-muted-foreground">{item.ventas} ticket{item.ventas === 1 ? "" : "s"}</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="ingresosBs"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIngresos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
