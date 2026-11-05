import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { MetricasTiendaDto } from "../../types/plataforma.types"

const CONFIG = { cantidad: { label: "Ventas", color: "var(--chart-1)" } } satisfies ChartConfig

/** Ventas pagadas por día (30 días, con ceros). Una serie, sin leyenda. */
export function GraficoVentas30d({ datos }: { datos: MetricasTiendaDto["ventasPorDia"] }) {
  const filas = datos.map((d) => ({ ...d, dia: d.fecha.slice(8, 10) + "/" + d.fecha.slice(5, 7) }))
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Ventas por día <span className="text-sm font-normal text-muted-foreground">(últimos 30 días)</span></h2>
      <ChartContainer config={CONFIG} className="aspect-auto h-56 w-full">
        <BarChart data={filas} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} interval={4} tick={{ fontSize: 11 }} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </section>
  )
}
