import { Link } from "react-router-dom"
import { cn } from "cn"

/** "Hecho con MirrorIA" en el pie de una tienda (se quita con el plan Cadena). Neutra: no usa colores de MirrorIA. */
export function InsigniaPlataforma({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
        className,
      )}
    >
      Hecho con <span className="font-semibold text-foreground">MirrorIA</span>
    </Link>
  )
}
