import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { mesCorto } from "../../lib/indicadores"
import type { DashboardPlataformaDto } from "../../types/plataforma.types"

const CONFIG = { altas: { label: "Altas", color: "var(--chart-1)" } } satisfies ChartConfig

/** Altas por mes (12 meses): una sola serie, etiquetas directas, sin leyenda. */
export function GraficoAltas({ datos }: { datos: DashboardPlataformaDto["altasPorMes"] }) {
  const filas = datos.map((d) => ({ ...d, etiqueta: mesCorto(d.mes) }))
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Altas por mes</h2>
      <ChartContainer config={CONFIG} className="aspect-auto h-56 w-full">
        <BarChart data={filas} margin={{ top: 20, left: 4, right: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
          <Bar dataKey="altas" fill="var(--color-altas)" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="altas" position="top" className="fill-muted-foreground" fontSize={11} formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </section>
  )
}
