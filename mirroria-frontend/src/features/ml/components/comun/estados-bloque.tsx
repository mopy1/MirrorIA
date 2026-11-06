import type { ReactNode } from "react"
import { ArrowClockwise, CloudSlash, type Icon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/** Error del bloque con salida: qué pasó y "Reintentar". */
export function EstadoError({ que, onReintentar }: { que: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:flex-row sm:items-center">
      <CloudSlash className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 text-foreground/85">
        No pudimos cargar {que}. Revisá tu conexión e intentá de nuevo.
      </p>
      <Button size="sm" variant="outline" onClick={onReintentar}>
        <ArrowClockwise data-icon="inline-start" aria-hidden /> Reintentar
      </Button>
    </div>
  )
}

interface EstadoVacioProps {
  icono: Icon
  titulo: string
  children: ReactNode
  accion?: ReactNode
}

/** Vacío que enseña: qué significa y qué hacer para que aparezca algo. */
export function EstadoVacio({ icono: Icono, titulo, children, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 px-4 py-8 text-center">
      <Icono className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <p className="max-w-[46ch] text-sm text-muted-foreground text-pretty">{children}</p>
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  )
}

/** Filas grises con la forma de una lista real (nombre + estado + detalle). */
export function EsqueletoFilas({ filas = 4 }: { filas?: number }) {
  return (
    <ul className="divide-y divide-border/70" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <li key={i} className="space-y-2 py-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full max-w-md" />
          <Skeleton className="h-3 w-56" />
        </li>
      ))}
    </ul>
  )
}
