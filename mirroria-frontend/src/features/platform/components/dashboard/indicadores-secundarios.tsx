import { formatMoney } from "@/lib/money"
import { porcentaje } from "../../lib/indicadores"
import type { DashboardPlataformaDto } from "../../types/plataforma.types"

/** Conversión de prueba, GMV y ARR: una franja plana, sin tarjetas (las tarjetas son solo los 5 KPIs). */
export function IndicadoresSecundarios({ datos: d }: { datos: DashboardPlataformaDto }) {
  const items = [
    { titulo: "Conversión de prueba a pago", valor: porcentaje(d.conversionPrueba.tasa), detalle: `${d.conversionPrueba.convertidas} de ${d.conversionPrueba.cerradas} pruebas cerradas` },
    { titulo: "Ventas de todas las tiendas (30 d)", valor: formatMoney(d.gmv30d.montoCents), detalle: `${d.gmv30d.ventas} ventas pagadas o entregadas` },
    { titulo: "ARR", valor: formatMoney(d.arrCents), detalle: "MRR × 12" },
  ]
  return (
    <dl className="grid gap-4 border-y border-border/60 py-4 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.titulo} className="sm:border-l sm:border-border/60 sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
          <dt className="text-sm text-muted-foreground">{i.titulo}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{i.valor}</dd>
          <dd className="text-xs text-muted-foreground">{i.detalle}</dd>
        </div>
      ))}
    </dl>
  )
}
