import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts"
import { useAnchoContenedor } from "../../hooks/useAnchoContenedor"
import { formatearMontoBs } from "../../lib/dashboard.utils"
import { fechaCorta } from "../../lib/fechas-dashboard"
import type { TendenciaIngresoDiaDto } from "../../types/dashboard.types"

const ALTO = 240

/** Eje vertical corto y en una línea: "8 mil" en vez de "Bs 8.000" (la unidad ya la dice el título). */
function montoEje(v: number): string {
  if (v === 0) return "0"
  return v >= 1000 ? `${(v / 1000).toLocaleString("es-BO")} mil` : v.toLocaleString("es-BO")
}

interface GraficoIngresosAreaProps {
  dias: TendenciaIngresoDiaDto[]
  mejorDia: TendenciaIngresoDiaDto
  resumenAccesible: string
}

/**
 * Serie diaria de lo vendido, en barras (con días sin ventas un área suavizada inventa curvas). Se mide el ancho real del contenedor y se le pasa a Recharts
 * explícito (ancho x 240 px): sin ResponsiveContainer, nunca se dibuja con -1.
 */
export function GraficoIngresosArea({ dias, mejorDia, resumenAccesible }: GraficoIngresosAreaProps) {
  const { ref, ancho } = useAnchoContenedor<HTMLDivElement>()

  return (
    <div ref={ref} role="img" aria-label={resumenAccesible} className="h-60 w-full min-w-0">
      {ancho > 0 && (
        <BarChart width={ancho} height={ALTO} data={dias} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="fecha"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickFormatter={(v: string) => fechaCorta(v)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickFormatter={montoEje}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const dia = active ? (payload?.[0]?.payload as TendenciaIngresoDiaDto | undefined) : undefined
              if (!dia) return null
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0/0.18)]">
                  <span className="font-semibold">{fechaCorta(dia.fecha)}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="tabular-nums">
                    {formatearMontoBs(dia.ingresosBs)} en {dia.ventas} {dia.ventas === 1 ? "compra" : "compras"}
                  </span>
                </div>
              )
            }}
          />
          <Bar dataKey="ingresosBs" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {dias.map((d) => (
              <Cell key={d.fecha} fill="var(--primary)" fillOpacity={d.fecha === mejorDia.fecha ? 1 : 0.45} />
            ))}
          </Bar>
        </BarChart>
      )}
    </div>
  )
}
