import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { FilaReporteHibrido } from "../../types/reports-hybrid.types"

interface WhatIfChartProps {
  filas: FilaReporteHibrido[]
}

const CONFIG_WHAT_IF = {
  real: { label: "Real (Base)", color: "var(--primary)" },
  proyectado: { label: "Proyectado", color: "#10b981" },
} satisfies ChartConfig

export function WhatIfChart({ filas }: WhatIfChartProps) {
  if (!filas || filas.length === 0) return null

  const datos = filas.map((f) => {
    const real =
      f.detalles?.original !== undefined
        ? Number(f.detalles.original)
        : (f.valorOriginal ?? f.valor)
    const proyectado = f.valorProyectado !== undefined ? f.valorProyectado : f.valor

    return {
      etiqueta: f.etiqueta,
      real,
      proyectado,
    }
  })

  const muchasCategorias = datos.length > 4

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Simulación What-If (Comparativa Real vs Proyectado)
        </h4>
      </div>

      <ChartContainer config={CONFIG_WHAT_IF} className="max-h-72 w-full">
        <BarChart data={datos} margin={{ bottom: muchasCategorias ? 24 : 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            angle={muchasCategorias ? -25 : 0}
            textAnchor={muchasCategorias ? "end" : "middle"}
            height={muchasCategorias ? 45 : 30}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={55}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="real" fill="var(--color-real)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="proyectado" fill="var(--color-proyectado)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
