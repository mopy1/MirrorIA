import { ArrowRight, CheckCircle } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccionSemana } from "../../lib/ml-acciones"
import { fraseSemana } from "../../lib/ml-acciones"
import type { TabPrediccion } from "../../lib/ml-tabs"
import { EstadoPill } from "../comun/estado-pill"

const ETIQUETA_TONO = { critico: "Urgente", alerta: "Pronto", atencion: "Esta semana", bien: "Al día" } as const

interface AccionesSemanaProps {
  acciones: AccionSemana[]
  isLoading: boolean
  onIrA: (tab: TabPrediccion) => void
}

/** "Qué hacer esta semana": la conclusión primero y hasta 4 acciones con verbo, cantidad y destino. */
export function AccionesSemana({ acciones, isLoading, onIrA }: AccionesSemanaProps) {
  return (
    <section aria-labelledby="ml-que-hacer" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 id="ml-que-hacer" className="text-base font-semibold text-foreground">Qué hacer esta semana</h2>
      {isLoading ? (
        <div className="mt-3 space-y-3" aria-busy="true">
          <Skeleton className="h-5 w-full max-w-xl" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <p className="mt-1.5 max-w-[70ch] text-[15px] text-foreground/90 text-pretty">{fraseSemana(acciones)}</p>
          {acciones.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" weight="fill" aria-hidden />
              Te avisamos aquí apenas una prenda empiece a escasear o una cita esté en riesgo.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/70 border-t border-border/70">
              {acciones.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <EstadoPill tono={a.tono} className="self-start sm:self-center">{ETIQUETA_TONO[a.tono]}</EstadoPill>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                    <p className="text-sm text-muted-foreground text-pretty">{a.detalle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onIrA(a.tab)}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring sm:self-center"
                  >
                    {a.boton} <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
