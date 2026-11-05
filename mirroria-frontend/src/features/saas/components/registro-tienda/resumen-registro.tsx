import { CalendarCheck, Storefront } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { formatMoneyEntero } from "@/lib/money"
import type { FormRegistro } from "../../hooks/useRegistroTiendaForm"
import type { PlanDto } from "../../types/saas.types"

/** Resumen lateral del asistente: qué se va a crear. */
export function ResumenRegistro({ form, plan }: { form: FormRegistro; plan: PlanDto | undefined }) {
  return (
    <aside className="rounded-2xl border border-border/60 bg-muted/30 p-6">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Tu tienda</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Storefront className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{form.tienda.nombre || "Nombre de tu tienda"}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">/t/{form.tienda.slug || "tu-tienda"}</p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">{plan ? `${plan.nombre} · ${formatMoneyEntero(plan.precioMensualCents)}/mes` : "Sin elegir"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Sucursal</dt>
          <dd className="truncate font-medium">{form.sucursal.nombre || "—"}</dd>
        </div>
      </dl>
      <Badge variant="outline" className="mt-6 gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CalendarCheck /> {plan?.diasPrueba ?? 14} días de prueba gratis
      </Badge>
      <p className="mt-3 text-xs text-muted-foreground">
        Te dejamos cargadas tallas, colores, categorías base y una colección inicial para que subas tu primera prenda ya.
      </p>
    </aside>
  )
}
