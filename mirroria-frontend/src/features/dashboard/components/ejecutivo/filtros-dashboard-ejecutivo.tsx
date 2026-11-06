import { ArrowsClockwise, CalendarBlank } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { SelectorSucursal } from "../shared/selector-sucursal"
import type { PeriodoDashboard } from "../../types/dashboard.types"
import { cn } from "cn"

export interface FiltrosDashboardEjecutivoProps {
  periodo: PeriodoDashboard
  fechaInicio?: string
  fechaFin?: string
  sucursalId?: string
  isLoading?: boolean
  onPeriodoChange: (periodo: PeriodoDashboard) => void
  onFechaInicioChange?: (fecha?: string) => void
  onFechaFinChange?: (fecha?: string) => void
  onSucursalChange: (sucursalId?: string) => void
  onRefrescar?: () => void
}

const PERIODOS: { id: PeriodoDashboard; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes_actual", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "personalizado", label: "Personalizado" },
]

function calcularRangoPredeterminado() {
  const hoy = new Date().toISOString().split("T")[0]
  const hace7d = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  return { hoy, hace7d }
}

export function FiltrosDashboardEjecutivo({
  periodo,
  fechaInicio,
  fechaFin,
  sucursalId,
  isLoading,
  onPeriodoChange,
  onFechaInicioChange,
  onFechaFinChange,
  onSucursalChange,
  onRefrescar,
}: FiltrosDashboardEjecutivoProps) {
  const handlePeriodoClick = (id: PeriodoDashboard) => {
    if (id === "personalizado" && (!fechaInicio || !fechaFin)) {
      const { hoy, hace7d } = calcularRangoPredeterminado()
      onFechaInicioChange?.(fechaInicio || hace7d)
      onFechaFinChange?.(fechaFin || hoy)
    }
    onPeriodoChange(id)
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-xs">
        <CalendarBlank className="size-4 ml-2 mr-1 text-muted-foreground shrink-0" />
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriodoClick(p.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              periodo === p.id
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === "personalizado" && (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground">Desde:</span>
          <input
            type="date"
            value={fechaInicio ?? ""}
            max={fechaFin || undefined}
            onChange={(e) => onFechaInicioChange?.(e.target.value || undefined)}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            aria-label="Fecha inicio"
          />
          <span className="text-[11px] font-medium text-muted-foreground">Hasta:</span>
          <input
            type="date"
            value={fechaFin ?? ""}
            min={fechaInicio || undefined}
            onChange={(e) => onFechaFinChange?.(e.target.value || undefined)}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            aria-label="Fecha fin"
          />
        </div>
      )}

      <SelectorSucursal sucursalId={sucursalId} onSucursalChange={onSucursalChange} />

      {onRefrescar && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefrescar}
          disabled={isLoading}
          className="h-7 gap-1.5 px-2.5 text-xs font-medium shadow-xs"
          title="Actualizar métricas"
        >
          <ArrowsClockwise className={cn("size-3.5", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      )}
    </div>
  )
}
