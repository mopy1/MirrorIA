import { useEffect, useState } from "react"
import { CalendarBlank, Storefront } from "@phosphor-icons/react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import type { Sucursal } from "@/features/branches/types/branches.types"
import type { PeriodoDashboard } from "../../types/dashboard.types"
import { cn } from "cn"

interface FiltrosDashboardEjecutivoProps {
  periodo: PeriodoDashboard
  sucursalId?: string
  onPeriodoChange: (periodo: PeriodoDashboard) => void
  onSucursalChange: (sucursalId?: string) => void
}

const PERIODOS: { id: PeriodoDashboard; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "mes_actual", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
]

export function FiltrosDashboardEjecutivo({
  periodo,
  sucursalId,
  onPeriodoChange,
  onSucursalChange,
}: FiltrosDashboardEjecutivoProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    branchesApi
      .getSucursales()
      .then((data) => setSucursales(data))
      .catch(() => setSucursales([]))
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Botones de período */}
      <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-xs">
        <CalendarBlank className="size-4 ml-2 mr-1 text-muted-foreground" />
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPeriodoChange(p.id)}
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

      {/* Selector de sucursal */}
      {sucursales.length > 0 && (
        <div className="inline-flex items-center rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs">
          <Storefront className="size-4 mr-1.5 text-muted-foreground" />
          <select
            value={sucursalId ?? ""}
            onChange={(e) => onSucursalChange(e.target.value ? e.target.value : undefined)}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer pr-1"
            aria-label="Filtrar por sucursal"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
