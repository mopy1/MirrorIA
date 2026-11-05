import { Check } from "@phosphor-icons/react"
import { CODIGOS_PALETA, PALETAS } from "@/lib/tema/marca.constants"
import type { CodigoPaleta } from "@/types/marca.types"
import { cn } from "cn"

interface Props {
  valor: CodigoPaleta | null
  onCambiar: (codigo: CodigoPaleta) => void
  className?: string
  /** Etiqueta accesible del grupo. */
  etiqueta?: string
}

/** Las 6 paletas sugeridas como radios (alta, apariencia y demo de la landing). Los colores son datos de la paleta. */
export function SelectorPaleta({ valor, onCambiar, className, etiqueta = "Paleta de colores" }: Props) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className={cn("grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2", className)}>
      {CODIGOS_PALETA.map((codigo) => {
        const p = PALETAS[codigo]
        const activa = valor === codigo
        return (
          <button
            key={codigo}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => onCambiar(codigo)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm transition-[border-color,box-shadow] duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              activa ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-foreground/30",
            )}
          >
            <span className="flex shrink-0 -space-x-1.5" aria-hidden>
              <span className="size-5 rounded-full ring-2 ring-background" style={{ backgroundColor: p.primario }} />
              <span className="size-5 rounded-full ring-2 ring-background" style={{ backgroundColor: p.acento }} />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{p.nombre}</span>
            {activa && <Check className="size-3.5 shrink-0 text-primary" weight="bold" />}
          </button>
        )
      })}
    </div>
  )
}
