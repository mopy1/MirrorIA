import { Tag } from "@phosphor-icons/react"
import type { CartLineItem } from "@/features/cart/hooks/useCartLineItems"
import { formatMoney } from "@/lib/money"

interface OrderSummaryProps {
  items: CartLineItem[]
  descuentoCents?: number
  codigoCupon?: string
}

export function OrderSummary({
  items,
  descuentoCents = 0,
  codigoCupon,
}: OrderSummaryProps) {
  const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0)
  const totalCents = Math.max(0, subtotalCents - descuentoCents)

  return (
    <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.varianteId} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground">
              {item.productoTitulo}{" "}
              <span className="text-muted-foreground">
                ({item.tallaNombre} · {item.colorNombre}) × {item.cantidad}
              </span>
            </span>
            <span className="text-foreground">{formatMoney(item.subtotalCents)}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 space-y-1.5 text-sm bg-muted/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatMoney(subtotalCents)}</span>
        </div>

        {descuentoCents > 0 && (
          <div className="flex items-center justify-between text-primary font-medium">
            <span className="flex items-center gap-1.5">
              <Tag className="size-3.5" />
              <span>Descuento {codigoCupon ? `(${codigoCupon})` : ""}</span>
            </span>
            <span>-{formatMoney(descuentoCents)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-base font-semibold text-foreground border-t border-border/50">
          <span>Total</span>
          <span>{formatMoney(totalCents)}</span>
        </div>
      </div>
    </div>
  )
}
