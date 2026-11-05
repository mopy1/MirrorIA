import { cn } from "cn"

const TAMANOS = {
  sm: { texto: "text-lg", iso: "size-7" },
  md: { texto: "text-[1.4rem]", iso: "size-8" },
  lg: { texto: "text-3xl", iso: "size-10" },
}

interface Props {
  variant?: "completo" | "isotipo"
  size?: keyof typeof TAMANOS
  className?: string
}

/** Isotipo: cuadrado índigo con una "m" de tres patas y el punto lima (geometría simple, sin dibujo). */
function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="6" y="9" width="17" height="4.5" rx="1.5" className="fill-primary-foreground" />
      <rect x="6" y="9" width="4.5" height="15" rx="1.5" className="fill-primary-foreground" />
      <rect x="12.25" y="9" width="4.5" height="15" rx="1.5" className="fill-primary-foreground" />
      <rect x="18.5" y="9" width="4.5" height="15" rx="1.5" className="fill-primary-foreground" />
      <circle cx="25" cy="24.5" r="3.5" className="fill-brand-accent dark:fill-primary-foreground" />
    </svg>
  )
}

/**
 * Wordmark `mirrorIA` (Bricolage Grotesque 700): el punto de la "i" es un
 * círculo lima, "la tienda está abierta" (spec §E.1); "IA" en mayúsculas.
 */
export function PlataformaLogo({ variant = "completo", size = "md", className }: Props) {
  const t = TAMANOS[size]
  if (variant === "isotipo") return <Isotipo className={cn(t.iso, className)} />
  return (
    <span
      className={cn("inline-flex items-baseline font-heading leading-none font-bold tracking-tight text-foreground", t.texto, className)}
      aria-label="MirrorIA"
      role="img"
    >
      <span aria-hidden>m</span>
      <span aria-hidden className="relative">
        ı
        <span className="absolute top-[0.1em] left-1/2 size-[0.22em] -translate-x-1/2 rounded-full bg-brand-accent ring-1 ring-foreground/10 dark:bg-primary dark:ring-0" />
      </span>
      <span aria-hidden>rrorIA</span>
    </span>
  )
}
