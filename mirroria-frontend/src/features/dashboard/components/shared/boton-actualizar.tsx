import { ArrowsClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "cn"

/** Botón solo ícono para volver a pedir los datos; el nombre va en tooltip y aria-label. */
export function BotonActualizar({ onClick, cargando }: { onClick: () => void; cargando?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="icon-sm" onClick={onClick} disabled={cargando} aria-label="Actualizar datos">
            <ArrowsClockwise className={cn("size-3.5", cargando && "animate-spin")} />
          </Button>
        }
      />
      <TooltipContent>Actualizar datos</TooltipContent>
    </Tooltip>
  )
}
