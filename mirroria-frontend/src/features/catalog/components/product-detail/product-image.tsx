import { useState } from "react"
import { ProductImagePlaceholder } from "@/components/common/ProductImagePlaceholder"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import type { Producto } from "../../types/catalog.types"

/** Foto principal de la prenda (o el placeholder si no tiene o no carga). */
export function ProductImage({ producto }: { producto: Producto }) {
  const [imgError, setImgError] = useState(false)
  const url = producto.imagenes?.[0]?.url
  return (
    <div className="overflow-hidden rounded-2xl bg-muted lg:sticky lg:top-24">
      {url && !imgError ? (
        <AspectRatio ratio={3 / 4}>
          <img
            src={url}
            alt={producto.titulo}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        </AspectRatio>
      ) : (
        <ProductImagePlaceholder ratio={3 / 4} iconClassName="size-16" />
      )}
    </div>
  )
}
