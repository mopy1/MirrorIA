import { CalendarBlank, CreditCard } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { MiSuscripcionDto } from "../types/suscripcion.types"
import { formatFecha } from "@/lib/fechas"

/** Plan, estado y vigencia de la suscripción más reciente. */
export function PlanActualCard({ data, acciones }: { data: MiSuscripcionDto; acciones: ReactNode }) {
  const { plan, suscripcion } = data
  const enPrueba = suscripcion.estado === "TRIAL"
  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Plan actual</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            {plan.nombre} <EstadoBadge estado={suscripcion.estado} />
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">{acciones}</div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Dato icono={<CreditCard />} titulo="Precio" valor={`${formatMoney(suscripcion.precioCents)} / mes`} />
        <Dato icono={<CalendarBlank />} titulo={enPrueba ? "La prueba termina" : "Vigente hasta"} valor={formatFecha(suscripcion.fin)} />
        <Dato
          icono={<CalendarBlank />}
          titulo="Días restantes"
          valor={suscripcion.diasRestantes === 0 ? "Vencida" : `${suscripcion.diasRestantes} ${suscripcion.diasRestantes === 1 ? "día" : "días"}`}
        />
      </CardContent>
    </Card>
  )
}

function Dato({ icono, titulo, valor }: { icono: ReactNode; titulo: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">{icono}</span>
      <div>
        <p className="text-xs text-muted-foreground">{titulo}</p>
        <p className="text-sm font-medium">{valor}</p>
      </div>
    </div>
  )
}
