import { ArrowClockwise, ArrowRight, ChartBar } from "@phosphor-icons/react"

interface TarjetaReporteListoProps {
  titulo: string
  abierto: boolean
  deshabilitado: boolean
  onClick: () => void
}

/** "Reporte listo · <título> · Ver reporte". Si la pestaña ya se cerró, ofrece volver a generarlo. */
export function TarjetaReporteListo({ titulo, abierto, deshabilitado, onClick }: TarjetaReporteListoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!abierto && deshabilitado}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors duration-150 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <ChartBar className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{abierto ? "Reporte listo" : "Cerraste este reporte"}</span>
        <span className="block truncate text-sm font-medium text-foreground">{titulo}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        {abierto ? "Ver reporte" : "Volver a generar"}
        {abierto ? (
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        ) : (
          <ArrowClockwise className="size-3.5" />
        )}
      </span>
    </button>
  )
}
