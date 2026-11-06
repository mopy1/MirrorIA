import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

const CLUSTER_COLORS: Record<string, string> = {
  VIPS_LEALES: "#8b5cf6",
  POTENCIALES_NUEVAS: "#10b981",
  EN_RIESGO_DORMIDAS: "#f59e0b",
  OCASIONALES_OUTLET: "#64748b",
}

const CLUSTER_LABELS: Record<string, string> = {
  VIPS_LEALES: "VIPs / Leales",
  POTENCIALES_NUEVAS: "Nuevas Promesas",
  EN_RIESGO_DORMIDAS: "En Riesgo",
  OCASIONALES_OUTLET: "Ocasionales",
}

interface MlRfmDonutProps {
  distribucion?: Record<string, number>
}

/** Gráfico donut estilizado con distribución de los 4 clusters RFM (K-Means). */
export function MlRfmDonut({ distribucion = {} }: MlRfmDonutProps) {
  const pieData = Object.entries(distribucion).map(([key, value]) => ({
    name: CLUSTER_LABELS[key] ?? key,
    value: Number(value),
    color: CLUSTER_COLORS[key] ?? "#6366f1",
  }))

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={4}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
