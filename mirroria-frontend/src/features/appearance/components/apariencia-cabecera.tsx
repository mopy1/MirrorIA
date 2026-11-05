import type { ReactNode } from "react"
import { ArrowSquareOut } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { NIVELES } from "@/lib/tema/marca.constants"
import type { MiMarcaDto } from "@/types/marca.types"
import { cn } from "cn"

/** Título, plan y acciones secundarias (el primario es "Guardar cambios", en la barra de abajo). "Ver mi tienda" en desktop ya está en la barra del panel. */
export function AparienciaCabecera({ mi, acciones }: { mi: MiMarcaDto | null; acciones?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Apariencia</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
          Tu logo, tus colores y tus fotos. Mirá cada cambio en la vista previa antes de guardarlo.
        </p>
        {mi && (
          <Badge variant="outline" className="mt-3 gap-1">
            Plan {mi.planNombre}: {NIVELES[mi.nivel].resumen}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {acciones}
        {mi && (
          <a href={`/t/${mi.slug}`} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 lg:hidden")}>
            Ver mi tienda <ArrowSquareOut />
          </a>
        )}
      </div>
    </div>
  )
}
