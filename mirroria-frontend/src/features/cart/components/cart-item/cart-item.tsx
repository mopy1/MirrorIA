import { useState } from "react"
import { Minus, Plus, Trash } from "@phosphor-icons/react"
import { ProductImagePlaceholder } from "@/components/common/ProductImagePlaceholder"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import type { CartLineItem } from "../../hooks/useCartLineItems"

interface CartItemProps {
  item: CartLineItem
  onRemove: (varianteId: string) => void
  onUpdateQuantity?: (varianteId: string, cantidad: number) => Promise<void> | void
  /** Sin red (o ítem aún en la outbox): cambiar o quitar necesita conexión. */
  bloqueado?: boolean
}

export function CartItem({ item, onRemove, onUpdateQuantity, bloqueado = false }: CartItemProps) {
  const [hasError, setHasError] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  async function updateQty(newQty: number) {
    if (isUpdating || !onUpdateQuantity) return
    setIsUpdating(true)
    try {
      await onUpdateQuantity(item.varianteId, newQty)
    } catch {
      // El error lo muestra la página (CartPage); acá solo se libera el botón.
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0 items-start">
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

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <p className="text-sm font-medium text-foreground truncate">{item.productoTitulo}</p>
          {item.pendiente && (
            <span className="mt-1 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              Pendiente de confirmar
            </span>
          )}
          {item.disponible ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Talla {item.tallaNombre} · {item.colorNombre}
            </p>
          ) : (
            <p className="text-xs text-destructive mt-0.5">Ya no está disponible: quitala para continuar.</p>
          )}
        </div>

        {item.disponible && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Disminuir cantidad"
                disabled={item.cantidad <= 1 || isUpdating || bloqueado}
                onClick={() => updateQty(item.cantidad - 1)}
              >
                <Minus />
              </Button>
              <span className="w-5 text-center font-mono text-xs font-medium">{item.cantidad}</span>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Aumentar cantidad"
                disabled={item.cantidad >= 3 || isUpdating || bloqueado}
                onClick={() => updateQty(item.cantidad + 1)}
              >
                <Plus />
              </Button>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Unit: {formatMoney(item.precioUnitCents)}</p>
              <p className="text-sm font-semibold text-foreground">{formatMoney(item.subtotalCents)}</p>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Quitar del carrito"
        disabled={isUpdating || bloqueado}
        onClick={() => onRemove(item.varianteId)}
      >
        <Trash />
      </Button>
    </div>
  )
}
