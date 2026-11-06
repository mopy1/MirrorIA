import type { ReactNode } from "react"
import { cn } from "cn"

interface SeccionPrediccionProps {
  titulo: string
  /** La conclusión de la sección, en una frase armada con los datos. */
  frase?: ReactNode
  /** Acción secundaria a la derecha del título (link o botón). */
  accion?: ReactNode
  children: ReactNode
  className?: string
}

/** Contenedor único de cada bloque de Predicciones: título, conclusión y contenido. */
export function SeccionPrediccion({ titulo, frase, accion, children, className }: SeccionPrediccionProps) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-card", className)} aria-label={titulo}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold text-foreground text-balance">{titulo}</h2>
          {frase && <p className="max-w-[70ch] text-sm text-muted-foreground text-pretty">{frase}</p>}
        </div>
        {accion}
      </header>
      <div className="px-4 pt-3 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </section>
  )
}
