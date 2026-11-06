import { useEffect, useState } from "react"
import { CalendarBlank, Storefront } from "@phosphor-icons/react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { cn } from "cn"

export const HORIZONTES_DEMANDA = [
  { dias: 7, label: "7 días" },
  { dias: 15, label: "15 días" },
  { dias: 30, label: "30 días" },
  { dias: 60, label: "60 días" },
]

export type MlVistaTab = "overview" | "demanda" | "noshow" | "rfm" | "auditoria"

const VISTAS: { id: MlVistaTab; label: string }[] = [
  { id: "overview", label: "Vista General" },
  { id: "demanda", label: "Demanda" },
  { id: "noshow", label: "No-Show" },
  { id: "rfm", label: "Clientas" },
  { id: "auditoria", label: "Auditoría" },
]

interface MlToolbarProps {
  vista: MlVistaTab
  onVistaChange: (v: MlVistaTab) => void
  dias: number
  onDiasChange: (dias: number) => void
  sucursalId?: string
  onSucursalChange: (sucursalId?: string) => void
  disabled?: boolean
}

/** Riel unificado de navegación y filtros ejecutivos (elimina pestañas apiladas). */
export function MlToolbar(props: MlToolbarProps) {
  const { vista, onVistaChange, dias, onDiasChange, sucursalId, onSucursalChange, disabled } = props
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    let activo = true
    branchesApi.getSucursales().then((s) => { if (activo) setSucursales(s.filter((x) => x.activo !== false)) })
      .catch(() => { if (activo) setSucursales([]) })
    return () => { activo = false }
  }, [])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-2 sm:px-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex rounded-lg border border-border/70 bg-muted/50 p-0.5" role="tablist">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={vista === v.id}
            onClick={() => onVistaChange(v.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all sm:px-3",
              vista === v.id ? "bg-background text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-xs">
          <CalendarBlank className="size-3.5 ml-2 mr-1 text-primary shrink-0" weight="duotone" />
          {HORIZONTES_DEMANDA.map((h) => (
            <button
              key={h.dias}
              type="button"
              disabled={disabled}
              onClick={() => onDiasChange(h.dias)}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 sm:px-2.5 sm:py-1",
                dias === h.dias ? "bg-primary text-primary-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs shadow-xs">
          <Storefront className="size-3.5 text-primary shrink-0" weight="duotone" />
          <select
            value={sucursalId ?? ""}
            onChange={(e) => onSucursalChange(e.target.value ? e.target.value : undefined)}
            disabled={disabled}
            className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer pr-1 disabled:opacity-50"
            aria-label="Filtrar por sucursal"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre} {s.ciudadNombre ? `(${s.ciudadNombre})` : ""}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
