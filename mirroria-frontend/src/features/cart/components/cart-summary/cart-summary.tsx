import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"

// Solo se renderiza con al menos un ítem (CartPage muestra un estado vacío
// aparte) — por eso no necesita un estado "disabled" propio.
export function CartSummary({ subtotalCents }: { subtotalCents: number }) {
  return (
    <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span className="text-base font-medium text-foreground">{formatMoney(subtotalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Envío y sucursal de entrega se definen en el siguiente paso.
      </p>

      <Link to="/checkout" className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}>
        Continuar a la compra
      </Link>
    </div>
  )
}
