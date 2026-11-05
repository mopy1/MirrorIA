import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatMoneyEntero } from "@/lib/money"
import type { DashboardPlataformaDto } from "../../types/plataforma.types"

const CONFIG = { mrr: { label: "MRR", color: "var(--chart-3)" } } satisfies ChartConfig

/** MRR por plan en barras horizontales, con el monto escrito al lado. */
export function MrrPorPlan({ datos }: { datos: DashboardPlataformaDto["mrrPorPlan"] }) {
  const filas = datos.map((d) => ({ plan: `${d.nombre} (${d.tiendas})`, mrr: d.mrrCents / 100 }))
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">MRR por plan <span className="text-sm font-normal text-muted-foreground">(tiendas pagas)</span></h2>
      {filas.length === 0 ? (
        <p className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Todavía ninguna tienda paga su plan.</p>
      ) : (
        <ChartContainer config={CONFIG} className="aspect-auto h-56 w-full">
          <BarChart data={filas} layout="vertical" margin={{ left: 8, right: 72 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="plan" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="mrr" fill="var(--color-mrr)" radius={4} barSize={22}>
              <LabelList dataKey="mrr" position="right" className="fill-foreground" fontSize={12} formatter={(v: unknown) => formatMoneyEntero(Number(v) * 100)} />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </section>
  )
}
