import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, Minus } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"
import { Skeleton } from "@/components/ui/skeleton"
import type { VariacionHumana } from "../../lib/variacion"
import { EtiquetaTono, type TonoEtiqueta } from "./etiqueta-tono"
import { cn } from "cn"

export interface KpiItemProps {
  titulo: string
  /** Qué significa el número, en una o dos frases. */
  ayuda: ReactNode
  valor: ReactNode
  detalle?: ReactNode
  variacion?: VariacionHumana
  estado?: { etiqueta: string; tono: TonoEtiqueta }
  principal?: boolean
  isLoading?: boolean
  className?: string
}

const COLOR_VARIACION = { bien: "text-emerald-700", mal: "text-rose-700", neutro: "text-muted-foreground" }

export function VariacionTexto({ variacion }: { variacion: VariacionHumana }) {
  const Icono = variacion.direccion === "sube" ? ArrowUp : variacion.direccion === "baja" ? ArrowDown : Minus
  return (
    <p className={cn("flex items-center gap-1 text-xs font-medium", COLOR_VARIACION[variacion.tono])}>
      <Icono className="size-3 shrink-0" weight="bold" aria-hidden />
      <span>{variacion.texto}</span>
    </p>
  )
}

/** Una cifra del tablero: nombre humano + ayuda, valor, si está bien o mal y contra qué se compara. */
export function KpiItem({ titulo, ayuda, valor, detalle, variacion, estado, principal, isLoading, className }: KpiItemProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 bg-card p-4 sm:p-5", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span>{titulo}</span>
        <AyudaTermino titulo={titulo}>{ayuda}</AyudaTermino>
      </p>
      {isLoading ? (
        <>
          <Skeleton className={cn("w-32", principal ? "h-9" : "h-7")} />
          <Skeleton className="h-3.5 w-40" />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "font-semibold tracking-tight text-foreground tabular-nums",
                principal ? "text-3xl sm:text-4xl" : "text-xl",
              )}
            >
              {valor}
            </span>
            {estado && <EtiquetaTono tono={estado.tono}>{estado.etiqueta}</EtiquetaTono>}
          </div>
          {variacion && <VariacionTexto variacion={variacion} />}
          {detalle && <p className="text-xs text-muted-foreground text-pretty tabular-nums">{detalle}</p>}
        </>
      )}
    </div>
  )
}
