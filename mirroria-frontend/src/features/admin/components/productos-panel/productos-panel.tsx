import { useMemo, useState } from "react"
import { MagnifyingGlass, Package, Plus, Sparkle, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { useResourceList } from "@/hooks/useResourceList"
import { AgregarVarianteDialog } from "./agregar-variante-dialog"
import { CrearProductoDialog } from "./crear-producto-dialog"
import { EditarProductoDialog } from "./editar-producto-dialog"
import { ProductosTable } from "./productos-table"

export function ProductosPanel() {
  const [search, setSearch] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS")
  const [crearOpen, setCrearOpen] = useState(false)
  const [varianteOpen, setVarianteOpen] = useState(false)
  const [selectedProductoId, setSelectedProductoId] = useState<string>()
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)

  const productos = useResourceList(catalogApi.getProductos)
  const categorias = useResourceList(catalogApi.getCategorias)
  const colecciones = useResourceList(catalogApi.getColecciones)

  const categoriaNombre = (id: string) => categorias.items.find((c) => c.id === id)?.nombre ?? id

  const productosFiltrados = useMemo(() => {
    return productos.items.filter((p) => {
      const matchSearch =
        p.titulo.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      const matchCategoria = categoriaFiltro === "TODAS" || p.categoriaId === categoriaFiltro
      return matchSearch && matchCategoria
    })
  }, [productos.items, search, categoriaFiltro])

  function handleOpenVariante(id?: string) {
    setSelectedProductoId(id)
    setVarianteOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-lg">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por prenda o slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Select value={categoriaFiltro} onValueChange={(v) => setCategoriaFiltro(v as string)}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Categoría">
                {(id: string) => (id === "TODAS" ? "Todas" : categoriaNombre(id))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las categorías</SelectItem>
              {categorias.items.map((c) => (
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
            <span>{productos.items.length} prendas</span>
          </Badge>
          <Button variant="outline" onClick={() => handleOpenVariante()} className="gap-1.5 h-10 text-xs">
            <Sparkle className="size-3.5 text-muted-foreground" />
            <span>+ Variante</span>
          </Button>
          <Button onClick={() => setCrearOpen(true)} className="gap-1.5 h-10 text-xs">
            <Plus className="size-3.5" />
            <span>Nuevo producto</span>
          </Button>
        </div>
      </div>

      {productos.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{productos.error}</AlertDescription>
        </Alert>
      )}

      {productos.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <ProductosTable
          productos={productosFiltrados}
          categorias={categorias.items}
          onOpenVariante={handleOpenVariante}
          onEditar={setEditingProducto}
        />
      )}

      <CrearProductoDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        categorias={categorias.items}
        colecciones={colecciones.items}
        onCreated={productos.reload}
      />

      {editingProducto && (
        <EditarProductoDialog
          key={editingProducto.id}
          open={Boolean(editingProducto)}
          onOpenChange={(open) => !open && setEditingProducto(null)}
          producto={editingProducto}
          categorias={categorias.items}
          colecciones={colecciones.items}
          onUpdated={productos.reload}
        />
      )}

      <AgregarVarianteDialog
        open={varianteOpen}
        onOpenChange={setVarianteOpen}
        productos={productos.items}
        productoInicialId={selectedProductoId}
        onVarianteCreada={productos.reload}
      />
    </div>
  )
}
