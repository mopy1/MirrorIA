import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TopPrendaDto } from "../../types/dashboard.types"

interface GraficoTopPrendasProps {
  prendas?: TopPrendaDto[]
  isLoading?: boolean
}

export function GraficoTopPrendas({ prendas, isLoading }: GraficoTopPrendasProps) {
  if (isLoading) {
    return (
      <Card className="h-80">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44 mb-1" />
          <Skeleton className="h-3.5 w-60" />
        </CardHeader>
        <CardContent className="h-60 pt-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const sinDatos = !prendas || prendas.length === 0

  return (
    <Card className="h-80 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Top 5 Prendas Más Vendidas</CardTitle>
        <CardDescription className="text-xs">Unidades vendidas y facturación por prenda</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-2">
        {sinDatos ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
            No hay ventas registradas de prendas en este lapso.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart layout="vertical" data={prendas} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={false}
                width={120}
                fontSize={11}
                stroke="var(--foreground)"
                tickFormatter={(val: string) => (val.length > 16 ? `${val.slice(0, 15)}…` : val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload as TopPrendaDto
                  return (
                    <div className="rounded-lg border border-border bg-popover p-2 shadow-md text-xs">
                      <p className="font-semibold text-popover-foreground">{item.nombre}</p>
                      <p className="text-muted-foreground">{item.categoria}</p>
                      <p className="text-primary font-bold mt-1">{item.unidadesVendidas} unidades</p>
                      <p className="text-muted-foreground font-medium">Bs {item.ingresosBs.toFixed(2)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="unidadesVendidas" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
