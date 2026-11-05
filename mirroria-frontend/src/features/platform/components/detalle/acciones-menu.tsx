import { ArrowCounterClockwise, ArrowsLeftRight, CalendarPlus, Copy, DotsThree, Pause, Play } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { InquilinoDetalleDto } from "../../types/plataforma.types"
import type { DialogoInquilino } from "./tipos"

/** Acciones secundarias del detalle (el primario contextual va aparte). */
export function AccionesMenu({ i, onAbrir }: { i: InquilinoDetalleDto; onAbrir: (d: DialogoInquilino) => void }) {
  const suspendida = i.estado === "SUSPENDIDO"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Más acciones"><DotsThree weight="bold" /></Button>} />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAbrir("plan")}><ArrowsLeftRight /> Cambiar plan</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAbrir("extender")}><CalendarPlus /> Extender vigencia</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAbrir("marca")}><ArrowCounterClockwise /> Restablecer marca</DropdownMenuItem>
        {i.propietario && (
          <DropdownMenuItem onClick={() => void navigator.clipboard?.writeText(i.propietario!.email)}><Copy /> Copiar email de la dueña</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {suspendida ? (
          <DropdownMenuItem onClick={() => onAbrir("estado")}><Play /> Reactivar</DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onAbrir("estado")}><Pause /> Suspender</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
