import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { FilaGrafico } from "../../lib/report-chart.utils"
import { esMetricaMoneda, formatearValorEje } from "../../lib/report-value.utils"
import { formatterTooltip } from "../report-tooltip"
import { LeyendaSeries } from "./leyenda-series"

interface GraficoLineaProps {
  filas: FilaGrafico[]
  metrica: string
  titulo: string
}

const NOMBRES = { valor: "Este período", referencia: "Período anterior" }

const CONFIG = {
  valor: { label: NOMBRES.valor, color: "var(--primary)" },
  referencia: { label: NOMBRES.referencia, color: "var(--muted-foreground)" },
} satisfies ChartConfig

/**
 * Serie de tiempo (día/mes). Altura explícita y `min-w-0` para que Recharts mida bien dentro
 * de flex/grid (sin el aviso `width(-1)`). Crosshair + tooltip con el valor exacto.
 */
export function GraficoLinea({ filas, metrica, titulo }: GraficoLineaProps) {
  const conReferencia = filas.some((f) => f.referencia !== undefined)
  const pocosPuntos = filas.length <= 14

  return (
    <figure className="min-w-0" aria-label={titulo}>
      {conReferencia && <LeyendaSeries series={[{ nombre: NOMBRES.valor, muestra: "bg-primary" }, { nombre: NOMBRES.referencia, muestra: "bg-muted-foreground/60" }]} />}
      <ChartContainer config={CONFIG} className="aspect-auto h-64 w-full min-w-0">
        <LineChart data={filas} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} minTickGap={16} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={esMetricaMoneda(metrica) ? 76 : 44}
            tickFormatter={(v: number) => formatearValorEje(v, metrica)}
          />
          <ChartTooltip cursor content={<ChartTooltipContent formatter={formatterTooltip(metrica, NOMBRES)} />} />
          {conReferencia && (
            <Line dataKey="referencia" stroke="var(--color-referencia)" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="4 4" dot={false} />
          )}
          <Line
            dataKey="valor"
            stroke="var(--color-valor)"
            strokeWidth={2}
            dot={pocosPuntos ? { r: 4, strokeWidth: 2, fill: "var(--background)" } : false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </figure>
  )
}
