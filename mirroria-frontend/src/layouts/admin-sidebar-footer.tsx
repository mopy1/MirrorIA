import { SidebarSimple } from "@phosphor-icons/react"
import { cn } from "cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AdminSidebarUsuarioMenu } from "./admin-sidebar-usuario-menu"

interface Props {
  rolLabel: string
  tiendaHref: string
  colapsado?: boolean
  /** Solo en escritorio: contrae/expande el menú a íconos. */
  onAlternarColapso?: () => void
  onNavigate?: () => void
}

/** Pie compacto: cuenta (con su menú), botón de contraer y la firma discreta de la plataforma. */
export function AdminSidebarFooter({ rolLabel, tiendaHref, colapsado = false, onAlternarColapso, onNavigate }: Props) {
  const etiqueta = colapsado ? "Expandir menú" : "Contraer menú"
  const botonColapso = onAlternarColapso && (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onAlternarColapso}
            aria-label={etiqueta}
            aria-pressed={colapsado}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none",
              "transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
              colapsado && "mx-auto",
            )}
          >
            <SidebarSimple className="size-4" />
          </button>
        }
      />
      <TooltipContent side="right" sideOffset={10}>{etiqueta}</TooltipContent>
    </Tooltip>
  )

  if (colapsado) {
    return (
      <div className="mt-auto flex shrink-0 flex-col items-center gap-1 border-t border-border/60 py-2">
        <AdminSidebarUsuarioMenu rolLabel={rolLabel} tiendaHref={tiendaHref} colapsado onNavigate={onNavigate} />
        {botonColapso}
      </div>
    )
  }

  return (
    <div className="mt-auto shrink-0 border-t border-border/60 px-3 pt-2 pb-2.5">
      <AdminSidebarUsuarioMenu rolLabel={rolLabel} tiendaHref={tiendaHref} onNavigate={onNavigate} />
      <div className="mt-1 flex h-8 items-center justify-between gap-2 pl-1.5">
        <p className="truncate text-[11px] text-muted-foreground">
          Funciona con <span className="font-medium text-foreground/80">MirrorIA</span>
        </p>
        {botonColapso}
      </div>
    </div>
  )
}
