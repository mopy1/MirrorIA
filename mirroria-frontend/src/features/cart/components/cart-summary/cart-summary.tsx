import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import { useRutaTienda } from "@/hooks/useRutaTienda"

// Solo se renderiza con al menos un ítem (CartPage muestra un estado vacío
// aparte) — por eso no necesita un estado "disabled" propio.
export function CartSummary({
  subtotalCents,
  bloqueado = false,
}: {
  subtotalCents: number
  /** Hay prendas dadas de baja: el checkout las rechazaría. */
  bloqueado?: boolean
}) {
  const ruta = useRutaTienda()
  return (
    <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span className="text-base font-medium text-foreground">{formatMoney(subtotalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Envío y sucursal de entrega se definen en el siguiente paso.
      </p>

      {bloqueado ? (
        <p className="mt-5 text-sm text-destructive">
          Quitá las prendas que ya no están disponibles para continuar.
        </p>
      ) : (
        <Link to={ruta("/checkout")} className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}>
          Continuar a la compra
        </Link>
      )}
    </div>
  )
}
