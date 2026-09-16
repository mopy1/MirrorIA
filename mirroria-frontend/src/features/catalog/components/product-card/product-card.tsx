import { useState } from "react"
import { Link } from "react-router-dom"
import { ProductImagePlaceholder } from "@/components/common/ProductImagePlaceholder"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { formatMoney } from "@/lib/money"
import type { Producto } from "../../types/catalog.types"

export function ProductCard({ producto }: { producto: Producto }) {
  const [hasError, setHasError] = useState(false)
  const imageUrl = producto.imagenes?.[0]?.url

  return (
    <Link
      to={`/tienda/producto/${producto.id}`}
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="overflow-hidden rounded-2xl bg-muted">
        {imageUrl && !hasError ? (
          <AspectRatio ratio={3 / 4}>
            <img
              src={imageUrl}
              alt={producto.titulo}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </AspectRatio>
        ) : (
          <ProductImagePlaceholder
            ratio={3 / 4}
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="text-sm font-medium text-foreground">{producto.titulo}</h3>
        <p className="text-sm text-muted-foreground">{formatMoney(producto.precioCents)}</p>
      </div>
    </Link>
  )
}
