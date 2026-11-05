import { HistorialSuscripcion } from "@/components/common/HistorialSuscripcion"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { formatFecha } from "@/lib/fechas"
import { formatMoney } from "@/lib/money"
import type { InquilinoDetalleDto } from "../../types/plataforma.types"

/** Plan actual, vigencia, precio congelado e historial. */
export function TabSuscripcion({ i }: { i: InquilinoDetalleDto }) {
  const actual = i.historial[0]
  const datos = [
    { t: "Plan", v: i.plan.nombre },
    { t: "Vigente hasta", v: `${formatFecha(i.suscripcion.fin)} (${i.suscripcion.diasRestantes} días)` },
    { t: "Precio congelado", v: actual ? `${formatMoney(actual.precioCents)} / mes` : "Sin dato" },
    { t: "MRR que aporta", v: formatMoney(i.mrrCents ?? 0) },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><h2 className="text-base font-medium">Suscripción actual</h2><EstadoBadge estado={i.suscripcion.estado} /></div>
      <dl className="grid gap-4 sm:grid-cols-4">
        {datos.map((d) => (
          <div key={d.t}>
            <dt className="text-sm text-muted-foreground">{d.t}</dt>
            <dd className="mt-1 font-medium tabular-nums">{d.v}</dd>
          </div>
        ))}
      </dl>
      <section className="space-y-3">
        <h2 className="text-base font-medium">Historial</h2>
        <HistorialSuscripcion historial={i.historial} />
      </section>
    </div>
  )
}
