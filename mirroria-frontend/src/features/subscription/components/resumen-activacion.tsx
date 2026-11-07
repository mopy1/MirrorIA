import { useState } from "react"
import { Check } from "@phosphor-icons/react"
import { EstadoBadge } from "@/components/common/EstadoBadge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FILAS_LIMITES, formatLimite } from "@/lib/limites-plan"
import { formatMoney, formatUsd } from "@/lib/money"
import { NIVELES } from "@/lib/tema/marca.constants"
import type { MiSuscripcionDto } from "../types/suscripcion.types"

type Moneda = "BOB" | "USD"

/** Qué se activa: plan, precio mensual en Bs o USD y qué incluye. */
export function ResumenActivacion({ plan, suscripcion }: Pick<MiSuscripcionDto, "plan" | "suscripcion">) {
  const [moneda, setMoneda] = useState<Moneda>("BOB")
  const precio = moneda === "BOB" ? formatMoney(plan.precioMensualCents) : formatUsd(plan.precioMensualUsdCents)
  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Vas a activar</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Plan {plan.nombre} <EstadoBadge estado={suscripcion.estado} />
          </h2>
        </div>
        <ToggleGroup variant="outline" size="sm" value={[moneda]} onValueChange={(v) => v[0] && setMoneda(v[0] as Moneda)} aria-label="Moneda">
          <ToggleGroupItem value="BOB">Bs</ToggleGroupItem>
          <ToggleGroupItem value="USD">USD</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">{precio}</span>
        <span className="text-sm text-muted-foreground">por mes</span>
      </p>
      <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2">
        {FILAS_LIMITES.map((f) => (
          <li key={f.clave} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-primary" weight="bold" />{formatLimite(plan.limites[f.clave], f.singular, f.plural)}</li>
        ))}
        {plan.nivelMarca && (
          <li className="flex items-center gap-2 sm:col-span-2"><Check className="size-4 shrink-0 text-primary" weight="bold" />Personalización: {NIVELES[plan.nivelMarca].resumen}</li>
        )}
      </ul>
    </section>
  )
}
