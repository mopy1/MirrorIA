import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import type { ItemPrediccionDemanda } from "../../types/ml.types"

interface MlDemandaChartProps {
  items: ItemPrediccionDemanda[]
}

/** Gráfico Recharts estilizado de demanda esperada vs stock para las prendas principales. */
export function MlDemandaChart({ items }: MlDemandaChartProps) {
  const chartData = items.slice(0, 6).map((it) => ({
    nombre: it.nombre ? it.nombre.slice(0, 16) : it.producto_id.replace("prod_", "").slice(0, 12),
    Demanda: Math.round(it.demanda_proyectada_unidades),
    Stock: it.stock_actual,
    reponer: it.reabastecimiento_sugerido,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 4 }}>
          <XAxis dataKey="nombre" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <Tooltip
            contentStyle={{
              fontSize: "11px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              color: "var(--card-foreground)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Bar dataKey="Demanda" name="Demanda proyectada" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Stock" name="Stock actual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
