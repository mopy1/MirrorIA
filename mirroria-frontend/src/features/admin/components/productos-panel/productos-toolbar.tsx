import { MagnifyingGlass, Package, Plus, Sparkle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Categoria } from "@/features/catalog/types/catalog.types"

interface Props {
  search: string
  onSearch: (v: string) => void
  categoriaFiltro: string
  onCategoria: (v: string) => void
  categorias: Categoria[]
  total: number
  onVariante: () => void
  onCrear: () => void
}

/** Búsqueda, filtro por categoría y acciones de la tabla de prendas. */
export function ProductosToolbar({ search, onSearch, categoriaFiltro, onCategoria, categorias, total, onVariante, onCrear }: Props) {
  const categoriaNombre = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? id
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-lg">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por prenda o slug..." value={search} onChange={(e) => onSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        <Select value={categoriaFiltro} onValueChange={(v) => onCategoria(v as string)}>
          <SelectTrigger className="w-full sm:w-44 h-10">
            <SelectValue placeholder="Categoría">{(id: string) => (id === "TODAS" ? "Todas" : categoriaNombre(id))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs font-normal">
          <Package className="size-3.5 mr-1 text-muted-foreground" />
          <span>{total} prendas</span>
        </Badge>
        <Button variant="outline" onClick={onVariante} className="gap-1.5 h-10 text-xs">
          <Sparkle className="size-3.5 text-muted-foreground" />
          <span>+ Variante</span>
        </Button>
        <Button onClick={onCrear} className="gap-1.5 h-10 text-xs">
          <Plus className="size-3.5" />
          <span>Nuevo producto</span>
        </Button>
      </div>
    </div>
  )
}
