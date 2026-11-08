import { ShoppingBag } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { checkoutApi } from "@/features/checkout/api/checkoutApi"
import { useResourceList } from "@/hooks/useResourceList"
import { cn } from "cn"
import { CartItem } from "../components/cart-item"
import { CartSummary } from "../components/cart-summary"
import { CompraPendiente } from "../components/compra-pendiente"
import { useCartLineItems } from "../hooks/useCartLineItems"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function CartPage() {
  const ruta = useRutaTienda()
  const { lineItems, variantes, isLoading, error, removeItem, updateItem } = useCartLineItems()
  const misVentas = useResourceList(checkoutApi.getMisVentas)
  const pendientes = misVentas.items.filter((v) => v.estado === "PENDIENTE")
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.subtotalCents, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Tu carrito</h1>

      {pendientes.length > 0 && (
        <div className="mt-6 space-y-4">
          {pendientes.map((venta) => (
            <CompraPendiente
              key={venta.id}
              venta={venta}
              variantes={variantes}
              onCancelada={misVentas.reload}
            />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : lineItems.length === 0 && !error ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <ShoppingBag className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {typeof navigator !== "undefined" && !navigator.onLine
              ? "Sin conexión: tu carrito se muestra cuando vuelva internet."
              : pendientes.length > 0 ? "Tu carrito está vacío." : "Todavía no agregaste nada."}
          </p>
          <Link to={ruta("/tienda")} className={cn(buttonVariants({ variant: "outline" }))}>
            Ir a la tienda
          </Link>
        </div>
      ) : (
        lineItems.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {lineItems.map((item) => (
                <CartItem
                  key={item.varianteId}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateItem}
                />
              ))}
            </div>
            <CartSummary
              subtotalCents={subtotalCents}
              bloqueado={lineItems.some((i) => !i.disponible)}
            />
          </div>
        )
      )}
    </div>
  )
}
