import { Buildings, CoatHanger } from "@phosphor-icons/react"
import type { AlternativasConflictoStock } from "@/lib/offline/idb.types"

/** Dónde más hay la prenda (datos reales del 409: `otrasSucursales` con nombre y `otrasTallas`). */
export function AlternativasConflicto({ alternativas }: { alternativas?: AlternativasConflictoStock }) {
  const sucursales = alternativas?.otrasSucursales ?? []
  const tallas = alternativas?.otrasTallas ?? []
  if (sucursales.length === 0 && tallas.length === 0) {
    return <p className="text-xs text-muted-foreground">Por ahora no queda en otras sucursales ni en otras tallas de ese color.</p>
  }
  return (
    <div className="space-y-2.5 text-xs">
      {sucursales.length > 0 && (
        <div className="space-y-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Buildings className="size-3.5" /> Hay en otras sucursales
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sucursales.map((s) => (
              <span key={s.sucursalId} className="rounded-md border bg-background px-2 py-0.5 text-[11px]">
                {s.sucursalNombre ?? "Otra sucursal"}: <strong>{s.disponible} disp.</strong>
              </span>
            ))}
          </div>
        </div>
      )}
      {tallas.length > 0 && (
        <div className="space-y-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CoatHanger className="size-3.5" /> En otras tallas, en la misma sucursal
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tallas.map((t) => (
              <span key={t.varianteId} className="rounded-md border bg-background px-2 py-0.5 text-[11px]">
                Talla {t.talla ?? "—"}: <strong>{t.disponible} disp.</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
