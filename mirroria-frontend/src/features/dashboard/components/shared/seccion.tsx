import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "@phosphor-icons/react"
import { AyudaTermino } from "@/components/common/ayuda-termino"
import { cn } from "cn"

interface SeccionProps {
  titulo: string
  /** Explicación corta del término del título (abre con el "?"). */
  ayuda?: ReactNode
  descripcion?: ReactNode
  enlace?: { href: string; texto: string }
  children: ReactNode
  className?: string
}

/** Superficie única de un bloque del tablero (sin cards anidadas adentro). */
export function Seccion({ titulo, ayuda, descripcion, enlace, children, className }: SeccionProps) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5", className)} aria-label={titulo}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {titulo}
            {ayuda && <AyudaTermino titulo={titulo}>{ayuda}</AyudaTermino>}
          </h2>
          {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
        </div>
        {enlace && <EnlaceSeccion href={enlace.href}>{enlace.texto}</EnlaceSeccion>}
      </header>
      <div className="mt-4 min-w-0 flex-1">{children}</div>
    </section>
  )
}

export function EnlaceSeccion({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      to={href}
      className="-mr-2 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children} <ArrowRight className="size-3" />
    </Link>
  )
}

/** Vacío que enseña: qué pasa y qué hacer, con acción opcional. */
export function VacioUtil({ texto, enlace }: { texto: string; enlace?: { href: string; texto: string } }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
      <p className="max-w-[52ch] text-pretty">{texto}</p>
      {enlace && <EnlaceSeccion href={enlace.href}>{enlace.texto}</EnlaceSeccion>}
    </div>
  )
}
