import { ArrowDownRight, ArrowUpRight, Minus, type Icon } from "@phosphor-icons/react"
import type { Tendencia } from "../../lib/indicadores"
import { cn } from "cn"

export interface Kpi {
  titulo: string
  valor: string
  icono: Icon
  detalle: string
  /** Variación con texto; `invertida` = bajar es bueno (churn). */
  variacion?: { tendencia: Tendencia; texto: string; invertida?: boolean }
}

const FLECHA = { sube: ArrowUpRight, baja: ArrowDownRight, igual: Minus }

/** La única "card" con borde del dashboard: número tabular + variación con color Y texto. */
export function KpiCard({ k }: { k: Kpi }) {
  const v = k.variacion
  const bueno = v && v.tendencia !== "igual" && (v.tendencia === "sube") !== Boolean(v.invertida)
  const Flecha = v ? FLECHA[v.tendencia] : null
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <k.icono className="size-4" /> {k.titulo}
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums">{k.valor}</p>
      {v && Flecha ? (
        <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", v.tendencia === "igual" ? "text-muted-foreground" : bueno ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
          <Flecha weight="bold" className="size-3.5" /> {v.texto}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{k.detalle}</p>
      )}
    </div>
  )
}
