import { Check } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { formatMoneyEntero } from "@/lib/money"
import { cn } from "cn"
import { FILAS_LIMITES, formatLimite, formatUsd } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"

export function PlanCard({ plan, destacado }: { plan: PlanDto; destacado: boolean }) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-200 hover:shadow-md",
        destacado ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/60 hover:border-primary/40",
      )}
    >
      {destacado && <Badge className="absolute -top-2.5 left-6">Más elegido</Badge>}
      <h3 className="text-lg font-semibold">{plan.nombre}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.descripcion ?? "Todo lo que necesitás para vender."}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{formatMoneyEntero(plan.precioMensualCents)}</span>
        <span className="text-sm text-muted-foreground">/mes</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        ≈ {formatUsd(plan.precioMensualUsdCents)} · {plan.diasPrueba} días gratis
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
        {FILAS_LIMITES.map((f) => (
          <li key={f.clave} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-primary" weight="bold" />
            {formatLimite(plan.limites[f.clave], f.singular, f.plural)}
          </li>
        ))}
      </ul>
      <Link
        to={`/registro-tienda?plan=${plan.codigo}`}
        className={cn(buttonVariants({ variant: destacado ? "default" : "outline", size: "lg" }), "mt-8 w-full")}
      >
        Empezar con {plan.nombre}
      </Link>
    </article>
  )
}
