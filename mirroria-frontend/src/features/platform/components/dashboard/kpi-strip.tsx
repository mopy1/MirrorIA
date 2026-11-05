import { CalendarPlus, CurrencyCircleDollar, HourglassMedium, Storefront, TrendDown } from "@phosphor-icons/react"
import { formatMoney } from "@/lib/money"
import { mesAnterior, porcentaje, variacion } from "../../lib/indicadores"
import type { DashboardPlataformaDto } from "../../types/plataforma.types"
import { KpiCard, type Kpi } from "./kpi-card"

function kpis(d: DashboardPlataformaDto): Kpi[] {
  const anterior = mesAnterior()
  return [
    { titulo: "Tiendas activas", valor: String(d.tiendas.activas), icono: Storefront, detalle: `${d.tiendas.total} en total · ${d.tiendas.suspendidas} suspendidas` },
    { titulo: "En prueba", valor: String(d.tiendas.enPrueba), icono: HourglassMedium, detalle: `${d.trialsPorVencer.length} vencen en 7 días o menos` },
    { titulo: "MRR", valor: formatMoney(d.mrrCents), icono: CurrencyCircleDollar, detalle: "Solo suscripciones pagadas" },
    { titulo: "Altas del mes", valor: String(d.altasMes), icono: CalendarPlus, detalle: "", variacion: variacion(d.altasMes, d.altasMesAnterior, anterior) },
    { titulo: "Churn 30 días", valor: porcentaje(d.churn30d.tasa), icono: TrendDown, detalle: `${d.churn30d.perdidas} de ${d.churn30d.base} pagas se fueron` },
  ]
}

/** Los 5 indicadores de arriba del Resumen (spec §D.2). */
export function KpiStrip({ datos }: { datos: DashboardPlataformaDto }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpis(datos).map((k) => <KpiCard key={k.titulo} k={k} />)}
    </div>
  )
}
