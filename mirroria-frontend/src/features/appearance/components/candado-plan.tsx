import type { ReactNode } from "react"
import { LockSimple } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NIVELES } from "@/lib/tema/marca.constants"
import type { NivelMarca } from "@/types/marca.types"

interface Props {
  bloqueado: boolean
  /** Nivel mínimo que lo incluye. */
  nivel: NivelMarca
  titulo: string
  children: ReactNode
}

/**
 * Bloque de opciones con candado: si el plan no lo incluye se ve igual (es lo
 * que vende el plan superior) pero deshabilitado, con el plan y "Mejorar plan".
 */
export function CandadoPlan({ bloqueado, nivel, titulo, children }: Props) {
  const plan = NIVELES[nivel].plan
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">{titulo}</h3>
        {bloqueado && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge variant="outline" className="gap-1 text-muted-foreground" tabIndex={0}>
                    <LockSimple weight="fill" /> {plan}
                  </Badge>
                }
              />
              <TooltipContent>Disponible desde el plan {plan}.</TooltipContent>
            </Tooltip>
            <Link to="/admin/suscripcion" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              Mejorar plan
            </Link>
          </>
        )}
      </div>
      <fieldset disabled={bloqueado} aria-disabled={bloqueado} className={bloqueado ? "pointer-events-none opacity-55" : undefined}>
        {children}
      </fieldset>
    </section>
  )
}
