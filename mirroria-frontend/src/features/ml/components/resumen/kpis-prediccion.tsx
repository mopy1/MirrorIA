import { CaretRight } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"
import type { KpiPrediccion } from "../../lib/ml-kpis"
import type { TabPrediccion } from "../../lib/ml-tabs"

const COLOR_VALOR = {
  bien: "text-foreground",
  atencion: "text-amber-700 dark:text-amber-300",
  alerta: "text-orange-700 dark:text-orange-300",
  critico: "text-rose-700 dark:text-rose-400",
} as const

interface KpisPrediccionProps {
  kpis: KpiPrediccion[]
  isLoading: boolean
  onIrA: (tab: TabPrediccion) => void
}

/** Franja de 4 números con nombre humano, comparación explícita y salto a su pestaña. */
export function KpisPrediccion({ kpis, isLoading, onIrA }: KpisPrediccionProps) {
  return (
    <section
      aria-label="Números clave"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border min-[480px]:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((k) => (
        <div key={k.id} className="flex min-w-0 flex-col gap-1 bg-card p-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{k.titulo}</span>
            <AyudaTermino titulo={k.titulo}>{k.ayuda}</AyudaTermino>
          </div>
          {isLoading ? (
            <Skeleton className="my-1 h-8 w-12" />
          ) : (
            <span className={cn("text-3xl font-semibold tabular-nums tracking-tight", COLOR_VALOR[k.tono])}>{k.valor}</span>
          )}
          <span className="text-xs text-muted-foreground text-pretty">{isLoading ? " " : k.detalle}</span>
          <button
            type="button"
            onClick={() => onIrA(k.tab)}
            className="mt-1 inline-flex w-fit items-center gap-0.5 rounded text-xs font-medium text-primary hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Ver detalle <CaretRight className="size-3" aria-hidden />
          </button>
        </div>
      ))}
    </section>
  )
}
