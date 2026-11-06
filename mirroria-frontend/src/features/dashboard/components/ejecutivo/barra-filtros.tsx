import { SelectorSucursal } from "../shared/selector-sucursal"
import { BotonActualizar } from "../shared/boton-actualizar"
import type { PeriodoDashboard } from "../../types/dashboard.types"
import { cn } from "cn"

export interface BarraFiltrosProps {
  periodo: PeriodoDashboard
  fechaInicio?: string
  fechaFin?: string
  sucursalId?: string
  isLoading?: boolean
  onPeriodoChange: (periodo: PeriodoDashboard) => void
  onFechaInicioChange: (fecha?: string) => void
  onFechaFinChange: (fecha?: string) => void
  onSucursalChange: (sucursalId?: string) => void
  onRefrescar: () => void
}

const PERIODOS: { id: PeriodoDashboard; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes_actual", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "personalizado", label: "Personalizado" },
]

/** Últimos 7 días como punto de partida del período personalizado. */
function rangoPorDefecto() {
  const ahora = Date.now()
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  return { desde: iso(ahora - 7 * 86_400_000), hasta: iso(ahora) }
}
const claseFecha =
  "h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"

/** Una sola barra: período + sucursal + actualizar. */
export function BarraFiltros(props: BarraFiltrosProps) {
  const { periodo, fechaInicio, fechaFin, isLoading } = props

  const elegir = (id: PeriodoDashboard) => {
    if (id === "personalizado" && (!fechaInicio || !fechaFin)) {
      const rango = rangoPorDefecto()
      props.onFechaInicioChange(fechaInicio ?? rango.desde)
      props.onFechaFinChange(fechaFin ?? rango.hasta)
    }
    props.onPeriodoChange(id)
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div role="group" aria-label="Período" className="flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-[3px]">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={periodo === p.id}
            onClick={() => elegir(p.id)}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              periodo === p.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === "personalizado" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            Desde
            <input type="date" value={fechaInicio ?? ""} max={fechaFin} onChange={(e) => props.onFechaInicioChange(e.target.value || undefined)} className={claseFecha} />
          </label>
          <label className="flex items-center gap-1.5">
            hasta
            <input type="date" value={fechaFin ?? ""} min={fechaInicio} onChange={(e) => props.onFechaFinChange(e.target.value || undefined)} className={claseFecha} />
          </label>
        </div>
      )}

      <SelectorSucursal sucursalId={props.sucursalId} onSucursalChange={props.onSucursalChange} />
      <BotonActualizar onClick={props.onRefrescar} cargando={isLoading} />
    </div>
  )
}
