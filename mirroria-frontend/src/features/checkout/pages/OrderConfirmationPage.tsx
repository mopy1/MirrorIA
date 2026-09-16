import { CheckCircle } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import { useVenta } from "../hooks/useVenta"

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const { venta, isLoading } = useVenta(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!venta) return null

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle weight="fill" className="size-14 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">¡Pedido registrado!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Comprobante #{venta.id.slice(0, 8).toUpperCase()}
      </p>
      <Badge variant="secondary" className="mt-3">
        {venta.estado === "PENDIENTE" ? "Pendiente de pago" : venta.estado}
      </Badge>
      <p className="mt-4 text-lg font-medium text-foreground">{formatMoney(venta.totalCents)}</p>

      <Link to="/tienda" className={cn(buttonVariants(), "mt-8")}>
        Seguir comprando
      </Link>
    </div>
  )
}
