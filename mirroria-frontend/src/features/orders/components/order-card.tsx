import { CreditCard } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import type { Pedido } from "../types/orders.types"
import { OrderStatusBadge } from "./order-status-badge"

interface OrderCardProps {
  pedido: Pedido
  variantes: VarianteConProducto[]
}

export function OrderCard({ pedido, variantes }: OrderCardProps) {
  const fecha = new Date(pedido.createdAt).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              {pedido.numeroComprobante || `#${pedido.id.slice(0, 8)}`}
            </span>
            <span className="text-xs text-muted-foreground">· {fecha}</span>
          </div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Canal {pedido.canal}
          </span>
        </div>
        <OrderStatusBadge estado={pedido.estado} />
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex flex-col divide-y border-b pb-3">
          {pedido.items.map((item) => {
            const v = variantes.find((x) => x.varianteId === item.varianteId)
            const titulo = v?.productoTitulo ?? "Prenda"
            const detalle = v ? `${v.tallaNombre} · ${v.colorNombre}` : ""
            return (
              <div
                key={item.id || item.varianteId}
                className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{titulo}</p>
                  {detalle && <p className="text-[11px] text-muted-foreground">{detalle}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-medium text-foreground">
                    {formatMoney(item.subtotalCents)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.cantidad} × {formatMoney(item.precioUnitCents)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2 text-xs">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono text-base font-semibold text-foreground">
              {formatMoney(pedido.totalCents)}
            </span>
            {pedido.descuentoCents > 0 && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                (Ahorro {formatMoney(pedido.descuentoCents)})
              </span>
            )}
          </div>

          {pedido.estado === "PENDIENTE" && (
            <Link
              to={`/pago/${pedido.id}`}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 self-start sm:self-auto")}
            >
              <CreditCard className="size-4" />
              Completar pago
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
