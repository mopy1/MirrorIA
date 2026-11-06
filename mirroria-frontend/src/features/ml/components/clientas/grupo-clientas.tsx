import { Link } from "react-router-dom"
import { Ticket } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"
import { buttonVariants } from "@/components/ui/button"
import { formatMoneyEntero } from "@/lib/money"
import type { GrupoClientas as Grupo } from "../../lib/ml-clientas"
import { contar } from "../../lib/ml-lenguaje"

interface GrupoClientasProps {
  grupo: Grupo
  /** Cupones solo los gestiona ADMIN. */
  puedeCrearCupon: boolean
}

/** Un grupo de clientas: cuántas son, qué significa, qué hacer y cuánto vale cada una. */
export function GrupoClientas({ grupo, puedeCrearCupon }: GrupoClientasProps) {
  return (
    <li className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 md:block">
          <h3 className="text-sm font-semibold text-foreground">{grupo.nombre}</h3>
          <p className="text-sm tabular-nums text-muted-foreground">
            {contar(grupo.cantidad, "clienta", "clientas")}
            <span className="text-muted-foreground/80"> · {grupo.porcentaje}%</span>
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(grupo.cantidad > 0 ? 2 : 0, grupo.porcentaje)}%` }} />
        </div>
      </div>

      <div className="min-w-0 space-y-1.5 text-sm">
        <p className="text-muted-foreground text-pretty">{grupo.significado}</p>
        <p className="text-foreground/90 text-pretty">
          <span className="font-medium text-foreground">Qué hacer: </span>
          {grupo.queHacer}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {grupo.valorPorClientaBs !== null && (
            <span className="inline-flex items-center gap-1">
              Valor estimado por clienta:
              <span className="font-medium tabular-nums text-foreground">{formatMoneyEntero(grupo.valorPorClientaBs * 100)}</span>
              <AyudaTermino titulo="Valor estimado por clienta">
                Cuánto se espera que compre en total cada clienta de este grupo, según lo que ya gastó.
              </AyudaTermino>
            </span>
          )}
          {grupo.nombres.length > 0 && <span className="min-w-0">Por ejemplo: {grupo.nombres.join(", ")}</span>}
        </div>
        {grupo.conCupon && puedeCrearCupon && grupo.cantidad > 0 && (
          <Link to="/admin/cupones" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-1" })}>
            <Ticket data-icon="inline-start" aria-hidden /> Crear un cupón
          </Link>
        )}
      </div>
    </li>
  )
}
