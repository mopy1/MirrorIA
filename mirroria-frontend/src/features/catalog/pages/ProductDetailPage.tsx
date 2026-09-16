import { useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductDetail } from "../components/product-detail"
import { useProducto } from "../hooks/useProducto"

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { producto, isLoading, error } = useProducto(id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      {isLoading && (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-[3/4] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {producto && <ProductDetail producto={producto} />}
    </div>
  )
}
