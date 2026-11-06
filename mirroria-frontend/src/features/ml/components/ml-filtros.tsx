import { useEffect, useState } from "react"
import { CalendarBlank, Storefront } from "@phosphor-icons/react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { cn } from "cn"

export const HORIZONTES_DEMANDA: { dias: number; label: string }[] = [
  { dias: 7, label: "7 días" },
  { dias: 15, label: "15 días" },
  { dias: 30, label: "30 días" },
  { dias: 60, label: "60 días" },
]

interface MlFiltrosProps {
  dias: number
  onDiasChange: (dias: number) => void
  sucursalId?: string
  onSucursalChange: (sucursalId?: string) => void
  disabled?: boolean
}

/** Barra interactiva de filtros operativos: horizonte temporal y selector de sucursal. */
export function MlFiltros({
  dias,
  onDiasChange,
  sucursalId,
  onSucursalChange,
  disabled,
}: MlFiltrosProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    let cancelado = false
    branchesApi
      .getSucursales()
      .then((items) => {
        if (!cancelado) setSucursales(items.filter((s) => s.activo !== false))
      })
      .catch(() => {
        if (!cancelado) setSucursales([])
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 sm:px-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Selector de Horizonte */}
        <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-xs">
          <CalendarBlank className="size-4 ml-2 mr-1 text-primary shrink-0" weight="duotone" />
          {HORIZONTES_DEMANDA.map((h) => (
            <button
              key={h.dias}
              type="button"
              disabled={disabled}
              onClick={() => onDiasChange(h.dias)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                dias === h.dias
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Selector de Sucursal con Storefront */}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs shadow-xs transition-colors hover:border-border">
          <Storefront className="size-4 text-primary shrink-0" weight="duotone" />
          <select
            value={sucursalId ?? ""}
            onChange={(e) => onSucursalChange(e.target.value ? e.target.value : undefined)}
            disabled={disabled}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer pr-1 disabled:opacity-50"
            aria-label="Filtrar por sucursal"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} {s.ciudadNombre ? `(${s.ciudadNombre})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground font-medium hidden md:block">
        Proyecciones actualizadas en tiempo real
      </div>
    </div>
  )
}
