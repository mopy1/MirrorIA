import { FileXls, Funnel, MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DIMENSIONES_DISPONIBLES = [
  { id: "sucursal", label: "Sucursal" },
  { id: "categoria", label: "Categoría" },
  { id: "producto", label: "Producto" },
  { id: "canal", label: "Canal" },
  { id: "metodo_pago", label: "Método de Pago" },
  { id: "proveedor_pago", label: "Pasarela / Proveedor" },
  { id: "proveedor", label: "Proveedor (Catálogo)" },
  { id: "dia", label: "Día" },
  { id: "mes", label: "Mes" },
]

interface Props {
  busqueda: string
  onBusquedaChange: (v: string) => void
  dimensionActual?: string
  onPivote?: (dim: string) => void
  onExportar: () => void
  exportando: boolean
  conteoFiltradas: number
  totalFilas: number
}

export function TablaDinamicaToolbar({
  busqueda,
  onBusquedaChange,
  dimensionActual,
  onPivote,
  onExportar,
  exportando,
  conteoFiltradas,
  totalFilas,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar en caliente..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {conteoFiltradas} de {totalFilas} filas
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onPivote && dimensionActual && (
          <div className="flex items-center gap-1.5">
            <Funnel className="size-4 text-muted-foreground" />
            <Select value={dimensionActual} onValueChange={(val) => onPivote(val as string)}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Pivotear por..." />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONES_DISPONIBLES.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExportar}
          disabled={exportando || totalFilas === 0}
          className="h-9 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
        >
          {exportando ? (
            <SpinnerGap className="size-4 animate-spin" />
          ) : (
            <FileXls className="size-4" weight="bold" />
          )}
          <span>Exportar a Excel (.xlsx)</span>
        </Button>
      </div>
    </div>
  )
}
