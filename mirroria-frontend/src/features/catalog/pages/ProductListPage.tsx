import { useSearchParams } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductGrid } from "../components/product-grid"
import { useCategorias } from "../hooks/useCategorias"
import { useProductos } from "../hooks/useProductos"

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoriaActivaId = searchParams.get("categoria")
  const query = searchParams.get("q")

  const { categorias, error: categoriasError } = useCategorias()
  const { productos, isLoading, error: productosError } = useProductos({
    categoriaId: categoriaActivaId ?? undefined,
    query: query ?? undefined,
  })
  const error = productosError ?? categoriasError

  function handleSelectCategoria(id: string | null) {
    const next = new URLSearchParams(searchParams)
    if (id) next.set("categoria", id)
    else next.delete("categoria")
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Tienda</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? (
          <>
            Resultados para <span className="text-foreground">"{query}"</span>
          </>
        ) : (
          "Explorá todo el catálogo de MirrorIA."
        )}
      </p>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8">
        <ProductGrid
          productos={productos}
          categorias={categorias}
          categoriaActivaId={categoriaActivaId}
          onSelectCategoria={handleSelectCategoria}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
