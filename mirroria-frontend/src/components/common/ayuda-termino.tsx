import type { ReactNode } from "react"
import { Popover } from "@base-ui/react/popover"
import { Question } from "@phosphor-icons/react"
import { cn } from "cn"

interface AyudaTerminoProps {
  /** Nombre del término (también es el nombre accesible del botón). */
  titulo: string
  /** Explicación corta en lenguaje de negocio: 1-2 frases, sin jerga. */
  children: ReactNode
  className?: string
}

/**
 * Glosario en línea: un "?" junto a un término que abre una explicación corta.
 * Popover (no Tooltip) para que también abra con un toque en pantallas táctiles.
 */
export function AyudaTermino({ titulo, children, className }: AyudaTerminoProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        aria-label={`¿Qué es "${titulo}"?`}
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors",
          "hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        <Question className="size-3.5" weight="bold" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={6} className="isolate z-50">
          <Popover.Popup
            className={cn(
              "max-w-72 origin-(--transform-origin) rounded-lg border border-border bg-popover px-3.5 py-3 text-popover-foreground",
              "shadow-[0_8px_24px_-8px_rgb(0_0_0/0.18)] transition-[opacity,transform] duration-150 ease-out",
              "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
            )}
          >
            <Popover.Title className="text-xs font-semibold text-foreground">{titulo}</Popover.Title>
            <Popover.Description render={<div />} className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {children}
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
