import { Check, PaintBrush } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { formatMoneyEntero } from "@/lib/money"
import { NIVELES } from "@/lib/tema/marca.constants"
import { cn } from "cn"
import { FILAS_LIMITES, formatLimite, formatUsd } from "../../lib/planes"
import type { PlanDto } from "../../types/saas.types"
import type { Moneda } from "./moneda-toggle"

/** Tarjeta de precio. La destacada: borde índigo, badge lima y 8 px más alta (no 3 iguales). */
export function PlanCard({ plan, destacado, moneda }: { plan: PlanDto; destacado: boolean; moneda: Moneda }) {
  const precio = moneda === "BOB" ? formatMoneyEntero(plan.precioMensualCents) : formatUsd(plan.precioMensualUsdCents)
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-shadow duration-200",
        destacado ? "border-primary shadow-[0_24px_48px_-28px_oklch(0.33_0.17_277/0.55)] md:-my-2 md:py-8" : "border-border/70 hover:shadow-md",
      )}
    >
      {destacado && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-semibold text-brand-accent-foreground dark:bg-primary dark:text-primary-foreground">
          Más elegido
        </span>
      )}
      <h3 className="text-xl font-semibold">{plan.nombre}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.descripcion ?? "Todo lo que necesitás para vender."}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-heading text-4xl font-bold tracking-tight tabular-nums">{precio}</span>
        <span className="text-sm text-muted-foreground">/mes</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{plan.diasPrueba} días de prueba sin pagar</p>
      <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
        {FILAS_LIMITES.map((f) => (
          <li key={f.clave} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-primary" weight="bold" />{formatLimite(plan.limites[f.clave], f.singular, f.plural)}</li>
        ))}
        {plan.nivelMarca && (
          <li className="flex items-start gap-2"><PaintBrush className="mt-0.5 size-4 shrink-0 text-primary" />{NIVELES[plan.nivelMarca].incluye}</li>
        )}
      </ul>
      <Link to={`/registro-tienda?plan=${plan.codigo}`} className={cn(buttonVariants({ variant: destacado ? "default" : "outline", size: "lg" }), "mt-8 h-11 w-full")}>
        Empezar con {plan.nombre}
      </Link>
    </article>
  )
}
