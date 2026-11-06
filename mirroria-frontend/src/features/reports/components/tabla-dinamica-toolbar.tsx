import { useId } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Opcion {
  id: string
  etiqueta: string
}

interface Props {
  busqueda: string
  onBusquedaChange: (v: string) => void
  /** Dimensión actual y alternativas válidas para la métrica; sin alternativas no se muestra "Ver por". */
  dimensionActual: string | null
  opciones: Opcion[]
  onPivote?: (dimension: string) => void
  conteoFiltradas: number
  totalFilas: number
}

/** Buscar dentro de los datos y reagrupar ("Ver por sucursal"). La exportación vive en el encabezado. */
export function TablaDinamicaToolbar({ busqueda, onBusquedaChange, dimensionActual, opciones, onPivote, conteoFiltradas, totalFilas }: Props) {
  const idBuscar = useId()
  const idVerPor = useId()
  const puedePivotear = Boolean(onPivote && dimensionActual) && opciones.length >= 2
  const etiquetaDe = (id: unknown) => opciones.find((o) => o.id === id)?.etiqueta ?? "Elegí cómo agrupar"

  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor={idBuscar} className="sr-only">Buscar en los datos</label>
        <div className="relative w-full sm:max-w-64">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={idBuscar}
            type="search"
            placeholder="Buscar en los datos"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <p className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {conteoFiltradas === totalFilas ? `${totalFilas} ${totalFilas === 1 ? "fila" : "filas"}` : `${conteoFiltradas} de ${totalFilas} filas`}
        </p>
      </div>

      {puedePivotear && (
        <div className="flex items-center gap-2">
          <span id={idVerPor} className="text-xs text-muted-foreground">Ver por</span>
          <Select value={dimensionActual} onValueChange={(v) => v && onPivote?.(String(v))}>
            <SelectTrigger aria-labelledby={idVerPor} className="h-9 min-w-36">
              <SelectValue>{etiquetaDe}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {opciones.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
