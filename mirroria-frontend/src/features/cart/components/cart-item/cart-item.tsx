import { useState } from "react"
import { Trash } from "@phosphor-icons/react"
import { ProductImagePlaceholder } from "@/components/common/ProductImagePlaceholder"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import type { CartLineItem } from "../../hooks/useCartLineItems"

interface CartItemProps {
  item: CartLineItem
  onRemove: (varianteId: string) => void
}

export function CartItem({ item, onRemove }: CartItemProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imagenUrl && !hasError ? (
          <img
            src={item.imagenUrl}
            alt={item.productoTitulo}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ProductImagePlaceholder ratio={1} iconClassName="size-5" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{item.productoTitulo}</p>
          <p className="text-sm text-muted-foreground">
            Talla {item.tallaNombre} · {item.colorNombre} · Cantidad {item.cantidad}
          </p>
        </div>
        <p className="text-sm text-foreground">{formatMoney(item.subtotalCents)}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Quitar del carrito"
        onClick={() => onRemove(item.varianteId)}
      >
        <Trash />
      </Button>
    </div>
  )
}
