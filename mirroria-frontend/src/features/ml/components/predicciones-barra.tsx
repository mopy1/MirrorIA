import { Storefront } from "@phosphor-icons/react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
import { useSucursalesActivas } from "../hooks/useSucursalesActivas"
import { HORIZONTES, TABS_PREDICCION } from "../lib/ml-tabs"

interface PrediccionesBarraProps {
  dias: number
  onDiasChange: (dias: number) => void
  sucursalId?: string
  onSucursalChange: (id?: string) => void
}

/** Pestañas a la izquierda; horizonte y sucursal a la derecha, en la misma barra. */
export function PrediccionesBarra({ dias, onDiasChange, sucursalId, onSucursalChange }: PrediccionesBarraProps) {
  const sucursales = useSucursalesActivas()

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 border-b border-border pb-3 min-[1600px]:flex-row min-[1600px]:items-center min-[1600px]:justify-between">
      <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0 min-[1600px]:flex-1">
        <TabsList variant="line" className="w-max">
          {TABS_PREDICCION.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="px-2.5">
              {t.etiqueta}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm min-[1600px]:shrink-0 min-[1600px]:flex-nowrap">
        <div role="group" aria-label="Proyectar a" className="inline-flex items-center rounded-lg bg-muted p-0.5">
          <span className="px-2 text-xs text-muted-foreground">Próximos</span>
          {HORIZONTES.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={dias === h}
              onClick={() => onDiasChange(h)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                dias === h ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {h} días
            </button>
          ))}
        </div>

        <label className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 focus-within:outline-2 focus-within:outline-ring">
          <Storefront className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="sr-only">Sucursal</span>
          <select
            value={sucursalId ?? ""}
            onChange={(e) => onSucursalChange(e.target.value || undefined)}
            className="min-w-0 max-w-52 cursor-pointer truncate bg-transparent text-xs font-medium text-foreground outline-none"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.ciudadNombre ? ` (${s.ciudadNombre})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
