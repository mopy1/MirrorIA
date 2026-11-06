import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle, Info, WarningCircle, type Icon } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"

export type TonoAviso = "info" | "atencion" | "bien"

export interface AvisoResumen {
  id: string
  tono: TonoAviso
  texto: ReactNode
  /** Ruta interna o callback; si no hay ninguno, el aviso es solo texto. */
  href?: string
  onClick?: () => void
  accion?: string
}

interface ResumenNarrativoProps {
  titulo: string
  /** Frase principal ya armada con los datos (la conclusión primero). */
  resumen: ReactNode
  avisos?: AvisoResumen[]
  isLoading?: boolean
  className?: string
}

const TONOS: Record<TonoAviso, { icon: Icon; color: string }> = {
  info: { icon: Info, color: "text-sky-600 dark:text-sky-400" },
  atencion: { icon: WarningCircle, color: "text-amber-600 dark:text-amber-400" },
  bien: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400" },
}

/** Encabezado "en palabras" de un tablero: conclusión + hasta 3 avisos accionables. */
export function ResumenNarrativo({ titulo, resumen, avisos = [], isLoading, className }: ResumenNarrativoProps) {
  if (isLoading) {
    return (
      <section className={cn("rounded-xl border border-border bg-card p-5", className)} aria-busy="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-xl" />
      </section>
    )
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)} aria-label={titulo}>
      <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
      <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-foreground/90 text-pretty">{resumen}</p>
      {avisos.length > 0 && (
        <ul className="mt-4 divide-y divide-border/70 border-t border-border/70">
          {avisos.slice(0, 3).map((aviso) => (
            <AvisoFila key={aviso.id} aviso={aviso} />
          ))}
        </ul>
      )}
    </section>
  )
}

function AvisoFila({ aviso }: { aviso: AvisoResumen }) {
  const { icon: IconoTono, color } = TONOS[aviso.tono]
  const accion = aviso.accion ?? "Ver"
  const claseAccion =
    "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring"
  return (
    <li className="flex items-start gap-3 py-2.5 text-sm">
      <IconoTono className={cn("mt-0.5 size-4 shrink-0", color)} weight="fill" />
      <span className="min-w-0 flex-1 text-foreground/85">{aviso.texto}</span>
      {aviso.href ? (
        <Link to={aviso.href} className={claseAccion}>
          {accion} <ArrowRight className="size-3" />
        </Link>
      ) : aviso.onClick ? (
        <button type="button" onClick={aviso.onClick} className={claseAccion}>
          {accion} <ArrowRight className="size-3" />
        </button>
      ) : null}
    </li>
  )
}
