import { cn } from "cn"
import { iniciales } from "./iniciales"

/** Iniciales sobre el color principal (respaldo del logo). `color` fija un hex fuera del tema (listados). */
export function Monograma({ nombre, className, color, texto }: { nombre: string; className?: string; color?: string; texto?: string }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground", className)}
      style={color ? { backgroundColor: color, color: texto } : undefined}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  )
}
