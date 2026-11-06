import { useEffect, useState } from "react"
import { Storefront } from "@phosphor-icons/react"
import { branchesApi } from "@/features/branches/api/branchesApi"
import type { Sucursal } from "@/features/branches/types/branches.types"
import { cn } from "cn"

export interface SelectorSucursalProps {
  sucursalId?: string
  onSucursalChange: (sucursalId?: string) => void
  disabled?: boolean
  className?: string
  labelTodas?: string
}

export function SelectorSucursal({
  sucursalId,
  onSucursalChange,
  disabled,
  className,
  labelTodas = "Todas las sucursales",
}: SelectorSucursalProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  useEffect(() => {
    branchesApi
      .getSucursales()
      .then((data) => setSucursales(data.filter((s) => s.activo !== false)))
      .catch(() => setSucursales([]))
  }, [])

  if (sucursales.length === 0) return null

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs shadow-xs transition-colors hover:border-border",
        className,
      )}
    >
      <Storefront className="size-4 shrink-0 text-muted-foreground" />
      <select
        value={sucursalId ?? ""}
        onChange={(e) => onSucursalChange(e.target.value ? e.target.value : undefined)}
        disabled={disabled}
        className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer pr-1 disabled:opacity-50"
        aria-label="Filtrar por sucursal"
      >
        <option value="">{labelTodas}</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre} {s.ciudadNombre ? `(${s.ciudadNombre})` : ""}
          </option>
        ))}
      </select>
    </div>
  )
}
