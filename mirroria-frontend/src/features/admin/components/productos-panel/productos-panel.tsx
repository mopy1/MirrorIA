import { useMemo, useState } from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { useResourceList } from "@/hooks/useResourceList"
import { AgregarVarianteDialog } from "./agregar-variante-dialog"
import { CrearProductoDialog } from "./crear-producto-dialog"
import { EditarProductoDialog } from "./editar-producto-dialog"
import { ProductosTable } from "./productos-table"
import { ProductosToolbar } from "./productos-toolbar"

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
      <ProductosToolbar
        search={search}
        onSearch={setSearch}
        categoriaFiltro={categoriaFiltro}
        onCategoria={setCategoriaFiltro}
        categorias={categorias.items}
        total={productos.items.length}
        onVariante={() => handleOpenVariante()}
        onCrear={() => setCrearOpen(true)}
      />

      {productos.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{productos.error}</AlertDescription>
        </Alert>
      )}

      {productos.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : productos.error ? null : (
        <ProductosTable
          productos={productosFiltrados}
          categorias={categorias.items}
          onOpenVariante={handleOpenVariante}
          onEditar={setEditingProducto}
          hayFiltro={productos.items.length > 0}
          onCrear={() => setCrearOpen(true)}
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
