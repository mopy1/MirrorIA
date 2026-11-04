import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { colorPorIndice, datosGrafico, elegirTipoGrafico } from "../lib/report-chart.utils"
import { esMetricaMoneda, formatearValorEje } from "../lib/report-value.utils"
import type { FilaReporteHibrido } from "../types/reports-hybrid.types"
import type { Reporte } from "../types/reports.types"
import { tooltipDinero } from "./report-tooltip"
import { WhatIfChart } from "./what-if-chart/what-if-chart"

const CONFIG_SERIE = {
  valor: { label: "Actual", color: "var(--primary)" },
  anterior: { label: "Período anterior", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function ReportChart({ reporte }: { reporte: Reporte }) {
  const tieneWhatIf =
    reporte.tipoGraficoSugerido === "what-if-comparison" ||
    reporte.esSimulacion ||
    reporte.filas.some((f) => f.valorProyectado !== undefined || f.detalles?.original !== undefined)

  if (tieneWhatIf) {
    return <WhatIfChart filas={reporte.filas as FilaReporteHibrido[]} />
  }

  if (reporte.filas.length <= 1) return null

  const { metrica } = reporte.ficha
  const tipo = elegirTipoGrafico(reporte)
  const datos = datosGrafico(reporte)
  const conVariacion = Boolean(reporte.comparacion)
  const esDinero = esMetricaMoneda(metrica)
  const muchasCategorias = datos.length > 5
  const ejeValor = (v: number) => formatearValorEje(v, metrica)
  const tooltipProps = esDinero ? { formatter: tooltipDinero(metrica) } : {}

  if (tipo === "pie") {
    const configPie = Object.fromEntries(
      datos.map((d, i) => [d.etiqueta, { label: d.etiqueta, color: colorPorIndice(i) }])
    ) satisfies ChartConfig
    return (
      <ChartContainer config={configPie} className="mx-auto max-h-80 aspect-square">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="etiqueta" hideLabel {...tooltipProps} />} />
          <Pie data={datos} dataKey="valor" nameKey="etiqueta" innerRadius="55%" outerRadius="85%" strokeWidth={2}>
            {datos.map((d, i) => <Cell key={d.etiqueta} fill={colorPorIndice(i)} />)}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="etiqueta" />} />
        </PieChart>
      </ChartContainer>
    )
  }

  if (tipo === "line") {
    return (
      <ChartContainer config={CONFIG_SERIE} className="max-h-80 w-full">
        <LineChart data={datos} margin={{ bottom: muchasCategorias ? 24 : 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} angle={muchasCategorias ? -30 : 0} textAnchor={muchasCategorias ? "end" : "middle"} height={muchasCategorias ? 50 : 30} />
          <YAxis tickLine={false} axisLine={false} width={esDinero ? 72 : 48} tickFormatter={ejeValor} />
          <ChartTooltip content={<ChartTooltipContent {...tooltipProps} />} />
          {conVariacion && <ChartLegend content={<ChartLegendContent />} />}
          <Line dataKey="valor" stroke="var(--color-valor)" strokeWidth={2} dot={false} />
          {conVariacion && <Line dataKey="anterior" stroke="var(--color-anterior)" strokeWidth={2} strokeDasharray="4 4" dot={false} />}
        </LineChart>
      </ChartContainer>
    )
  }

  if (tipo === "bar-horizontal") {
    return (
      <ChartContainer config={CONFIG_SERIE} className="w-full" style={{ height: Math.max(datos.length * 36, 160) }}>
        <BarChart data={datos} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={ejeValor} />
          <YAxis type="category" dataKey="etiqueta" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent {...tooltipProps} />} />
          <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
        </BarChart>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer config={CONFIG_SERIE} className="max-h-80 w-full">
      <BarChart data={datos} margin={{ bottom: muchasCategorias ? 24 : 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} angle={muchasCategorias ? -30 : 0} textAnchor={muchasCategorias ? "end" : "middle"} height={muchasCategorias ? 50 : 30} />
        <YAxis tickLine={false} axisLine={false} width={esDinero ? 72 : 48} tickFormatter={ejeValor} />
        <ChartTooltip content={<ChartTooltipContent {...tooltipProps} />} />
        {conVariacion && <ChartLegend content={<ChartLegendContent />} />}
        <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
        {conVariacion && <Bar dataKey="anterior" fill="var(--color-anterior)" radius={4} />}
      </BarChart>
    </ChartContainer>
  )
}
