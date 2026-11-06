import { ChartBar, SpinnerGap, SquaresFour, WarningCircle, X } from "@phosphor-icons/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "cn"
import type { ReportTab } from "../../types/chat.types"
import { ID_PANEL, idPestana } from "./pestanas-teclado"

interface PestanaProps {
  tab: ReportTab
  activa: boolean
  onActivar: () => void
  onCerrar: () => void
}

function IconoPestana({ tab }: { tab: ReportTab }) {
  if (tab.tipo === "resumen") return <SquaresFour className="size-4 shrink-0" />
  if (tab.cargando) return <SpinnerGap className="size-4 shrink-0 animate-spin text-primary" aria-label="Generando" />
  if (tab.error) return <WarningCircle className="size-4 shrink-0 text-destructive" aria-label="No se pudo generar" />
  return <ChartBar className="size-4 shrink-0" />
}

/** Una pestaña tipo documento: ícono + título truncado (completo en tooltip) + cerrar. */
export function Pestana({ tab, activa, onActivar, onCerrar }: PestanaProps) {
  const cerrable = tab.tipo === "reporte"
  const boton = (
    <button
      type="button"
      role="tab"
      id={idPestana(tab.id)}
      aria-selected={activa}
      aria-controls={ID_PANEL}
      tabIndex={activa ? 0 : -1}
      onClick={onActivar}
      className={cn(
        "flex min-w-0 items-center gap-2 py-2 text-sm outline-none",
        cerrable ? "pl-3 pr-1" : "px-3",
        "focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <IconoPestana tab={tab} />
      <span className="truncate">{tab.titulo}</span>
    </button>
  )

  return (
    <div
      className={cn(
        "group flex max-w-60 shrink-0 items-center rounded-t-lg border border-b-0 transition-colors duration-150",
        activa
          ? "border-border bg-card font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {cerrable ? (
        <Tooltip>
          <TooltipTrigger render={boton} />
          <TooltipContent side="bottom">{tab.titulo}</TooltipContent>
        </Tooltip>
      ) : (
        boton
      )}
      {cerrable && (
        <button
          type="button"
          onClick={onCerrar}
          tabIndex={activa ? 0 : -1}
          aria-label={`Cerrar el reporte "${tab.titulo}"`}
          className={cn(
            "mr-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[opacity,color,background-color] duration-150",
            "hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
            !activa && "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
