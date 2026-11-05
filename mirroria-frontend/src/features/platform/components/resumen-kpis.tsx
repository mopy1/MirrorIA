import { CalendarPlus, CurrencyCircleDollar, HourglassMedium, Storefront, type Icon } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import type { ResumenPlataformaDto } from "../types/plataforma.types"

interface Kpi {
  icono: Icon
  titulo: string
  valor: string
  detalle: string
}

function kpis(r: ResumenPlataformaDto): Kpi[] {
  const t = r.inquilinos
  return [
    { icono: Storefront, titulo: "Tiendas activas", valor: String(t.activos), detalle: `${t.total} en total · ${t.suspendidos} suspendidas` },
    { icono: HourglassMedium, titulo: "En prueba", valor: String(t.enTrial), detalle: `${r.trialsPorVencer.length} vencen en ≤ 7 días · ${t.vencidos} vencidas` },
    { icono: CurrencyCircleDollar, titulo: "MRR estimado", valor: formatMoney(r.mrrCents), detalle: "Suscripciones pagas vigentes" },
    { icono: CalendarPlus, titulo: "Altas (30 días)", valor: String(r.altasUltimos30Dias), detalle: "Tiendas creadas el último mes" },
  ]
}

/** KPIs de `GET /saas/plataforma/resumen`. */
export function ResumenKpis({ resumen, isLoading }: { resumen: ResumenPlataformaDto | null; isLoading: boolean }) {
  if (isLoading || !resumen) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis(resumen).map((k) => (
        <div key={k.titulo} className="rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{k.titulo}</p>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <k.icono className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{k.valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{k.detalle}</p>
        </div>
      ))}
    </div>
  )
}
