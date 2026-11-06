import { useId, type ReactNode } from "react"
import { cn } from "cn"

interface SeccionLienzoProps {
  titulo: string
  /** Controles o nota a la derecha del título (se apilan debajo en pantallas angostas). */
  extra?: ReactNode
  children: ReactNode
  className?: string
}

/** Una sección del lienzo: título corto + contenido. Las secciones se separan con un divisor, sin tarjetas anidadas. */
export function SeccionLienzo({ titulo, extra, children, className }: SeccionLienzoProps) {
  const idTitulo = useId()
  return (
    <section aria-labelledby={idTitulo} className={cn("min-w-0 px-4 py-6 sm:px-7", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 id={idTitulo} className="text-sm font-semibold text-foreground">
          {titulo}
        </h3>
        {extra}
      </div>
      {children}
    </section>
  )
}
