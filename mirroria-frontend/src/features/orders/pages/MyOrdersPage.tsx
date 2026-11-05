import { ShoppingBag } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { useResourceList } from "@/hooks/useResourceList"
import { cn } from "cn"
import { ordersApi } from "../api/ordersApi"
import { OrderCard } from "../components/order-card"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function MyOrdersPage() {
  const ruta = useRutaTienda()
  const { items: pedidos, isLoading, error } = useResourceList(ordersApi.getMisPedidos)
  const { variantes } = useVariantesConProducto()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Mis pedidos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Historial de compras en tienda y pedidos online.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="mt-8 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : pedidos.length === 0 && !error ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <ShoppingBag className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Todavía no realizaste ninguna compra.
          </p>
          <Link to={ruta("/tienda")} className={cn(buttonVariants({ variant: "outline" }))}>
            Explorar la tienda
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {pedidos.map((pedido) => (
            <OrderCard key={pedido.id} pedido={pedido} variantes={variantes} />
          ))}
        </div>
      )}
    </div>
  )
}
